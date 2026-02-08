"""
Transaction Simulation API - For Demo and Testing
Creates realistic transaction simulations with rollback scenarios
"""
from fastapi import APIRouter,HTTPException
from typing import Dict, Any, List
import uuid
import asyncio
from datetime import datetime
import random

router = APIRouter()


class TransactionSimulator:
    """
    Simulates distributed transactions with various outcomes for demonstration.
    """

    def __init__(self):
        self.scenarios = [
            "success",
            "partial_failure",
            "payment_failure",
            "hotel_unavailable",
            "flight_cancelled"
        ]

    async def simulate_transaction(
        self,
        journey_id: str,
        customer_name: str,
        total_amount: float,
        scenario: str = None
    ) -> Dict[str, Any]:
        """
        Simulate a complete transaction with realistic timing and outcomes.
        """
        if scenario is None:
            scenario = random.choice(self.scenarios)

        transaction_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
        steps = self._get_steps_for_scenario(scenario, total_amount)

        simulation_result = {
            "transaction_id": transaction_id,
            "scenario": scenario,
            "customer_name": customer_name,
            "total_amount": total_amount,
            "total_steps": len(steps),
            "steps_completed": 0,
            "steps_failed": 0,
            "status": "initiated",
            "events": [],
            "compensation_actions": [],
            "dlq_items": []
        }

        # Add initial event
        simulation_result["events"].append({
            "timestamp": datetime.now().isoformat(),
            "event": "transaction_started",
            "message": f"Transaction {transaction_id} initiated for {customer_name}",
            "severity": "info"
        })

        # Execute steps with delays for realism
        for step_num, step in enumerate(steps, 1):
            await asyncio.sleep(0.5)  # Realistic delay

            step_result = await self._execute_step(
                step, step_num, scenario, simulation_result
            )

            if step_result["status"] == "completed":
                simulation_result["steps_completed"] += 1
                simulation_result["events"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "step_completed",
                    "step": step["name"],
                    "message": f"✓ {step['name']} completed successfully",
                    "severity": "info",
                    "duration_ms": step_result.get("duration_ms", 0)
                })

            elif step_result["status"] == "failed":
                simulation_result["steps_failed"] += 1
                simulation_result["status"] = "failed"
                simulation_result["error_step"] = step["name"]
                simulation_result["error_message"] = step_result.get("error", "Unknown error")

                simulation_result["events"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "step_failed",
                    "step": step["name"],
                    "message": f"✗ {step['name']} failed: {step_result.get('error')}",
                    "severity": "error"
                })

                # Trigger compensation
                await self._compensate_transaction(
                    simulation_result, step_num - 1, scenario
                )
                break

        if simulation_result["status"] != "failed":
            simulation_result["status"] = "completed"
            simulation_result["events"].append({
                "timestamp": datetime.now().isoformat(),
                "event": "transaction_completed",
                "message": f"Transaction {transaction_id} completed successfully",
                "severity": "info"
            })

        return simulation_result

    def _get_steps_for_scenario(self, scenario: str, amount: float) -> List[Dict]:
        """Get transaction steps based on scenario."""
        base_steps = [
            {"name": "Reserve Flight", "type": "flight_booking", "amount": amount * 0.4},
            {"name": "Reserve Hotel", "type": "hotel_booking", "amount": amount * 0.3},
            {"name": "Book Local Transport", "type": "transport_booking", "amount": amount * 0.1},
            {"name": "Process Payment", "type": "payment_processing", "amount": amount},
            {"name": "Send Confirmation", "type": "notification_send", "amount": 0}
        ]

        if scenario == "payment_failure":
            # Payment will fail
            base_steps[3]["will_fail"] = True
            base_steps[3]["error"] = "Payment gateway declined - Insufficient funds"

        elif scenario == "hotel_unavailable":
            # Hotel booking will fail
            base_steps[1]["will_fail"] = True
            base_steps[1]["error"] = "Hotel fully booked - No rooms available"

        elif scenario == "flight_cancelled":
            # Flight booking fails
            base_steps[0]["will_fail"] = True
            base_steps[0]["error"] = "Flight cancelled by airline"

        elif scenario == "partial_failure":
            # Transport booking fails
            base_steps[2]["will_fail"] = True
            base_steps[2]["error"] = "No  transport available for selected route"

        return base_steps

    async def _execute_step(
        self,
        step: Dict,
        step_num: int,
        scenario: str,
        simulation: Dict
    ) -> Dict[str, Any]:
        """Execute a single transaction step."""
        duration_ms = random.randint(1000, 5000)

        if step.get("will_fail"):
            return {
                "status": "failed",
                "error": step["error"],
                "duration_ms": duration_ms
            }

        return {
            "status": "completed",
            "duration_ms": duration_ms,
            "result": {
                "step_number": step_num,
                "type": step["type"],
                "confirmation_code": f"CONF-{uuid.uuid4().hex[:8].upper()}"
            }
        }

    async def _compensate_transaction(
        self,
        simulation: Dict,
        completed_steps: int,
        scenario: str
    ):
        """Compensate completed steps after failure."""
        simulation["events"].append({
            "timestamp": datetime.now().isoformat(),
            "event": "compensation_started",
            "message": f"🔄 Starting rollback of {completed_steps} completed steps",
            "severity": "warning"
        })

        simulation["status"] = "compensating"

        # Compensate each completed step in reverse order
        for step_num in range(completed_steps, 0, -1):
            await asyncio.sleep(0.3)  # Compensation delay

            # Simulate occasional compensation failures for DLQ
            compensation_fails = (
                scenario == "hotel_unavailable" and step_num == 2 and random.random() < 0.7
            ) or (
                scenario == "payment_failure" and step_num == 4 and random.random() < 0.5
            )

            if compensation_fails:
                compensation_action = {
                    "step_number": step_num,
                    "status": "failed",
                    "error": "Compensation failed - System unavailable",
                    "attempts": 3,
                    "timestamp": datetime.now().isoformat()
                }

                simulation["compensation_actions"].append(compensation_action)

                # Add to DLQ
                dlq_item = {
                    "dlq_id": f"DLQ-{uuid.uuid4().hex[:8].upper()}",
                    "step_number": step_num,
                    "failure_reason": "Compensation system timeout. Manual intervention required.",
                    "attempts_made": 3,
                    "resolution_status": "pending",
                    "escalated": False,
                    "created_at": datetime.now().isoformat()
                }

                simulation["dlq_items"].append(dlq_item)

                simulation["events"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "compensation_failed",
                    "step": step_num,
                    "message": f"⚠️ Step {step_num} compensation failed - Added to DLQ",
                    "severity": "error"
                })

                simulation["status"] = "partial_failure"

            else:
                compensation_action = {
                    "step_number": step_num,
                    "status": "completed",
                    "timestamp": datetime.now().isoformat(),
                    "duration_ms": random.randint(500, 2000)
                }

                simulation["compensation_actions"].append(compensation_action)

                simulation["events"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "step_compensated",
                    "step": step_num,
                    "message": f"✓ Step {step_num} rolled back successfully",
                    "severity": "info"
                })

        if simulation["status"] == "compensating":
            simulation["status"] = "compensated"
            simulation["events"].append({
                "timestamp": datetime.now().isoformat(),
                "event": "compensation_completed",
                "message": "All steps rolled back successfully",
                "severity": "info"
            })


# Global simulator instance
simulator = TransactionSimulator()


@router.post("/simulate")
async def simulate_transaction(
    customer_name: str = "Demo Customer",
    total_amount: float = 50000,
    scenario: str = None
):
    """
    Simulate a transaction with realistic timing and outcomes.

    Scenarios:
    - success: All steps complete successfully
    - partial_failure: One step fails, others rollback
    - payment_failure: Payment fails, full rollback
    - hotel_unavailable: Hotel booking fails
    - flight_cancelled: Flight booking fails

    Returns real-time simulation with events and compensation.
    """
    try:
        journey_id = str(uuid.uuid4())

        result = await simulator.simulate_transaction(
            journey_id=journey_id,
            customer_name=customer_name,
            total_amount=total_amount,
            scenario=scenario
        )

        return {
            "success": True,
            "simulation": result,
            "message": f"Simulation completed: {result['status']}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate/batch")
async def simulate_batch_transactions(count: int = 5):
    """
    Simulate multiple transactions for stress testing.
    Shows various scenarios and outcomes.
    """
    if count > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 simulations at once")

    scenarios = ["success", "partial_failure", "payment_failure", "hotel_unavailable", "flight_cancelled"]
    results = []

    for i in range(count):
        scenario = scenarios[i % len(scenarios)]
        customer_name = f"Customer-{i+1}"
        total_amount = round(random.uniform(20000, 100000), 2)

        result = await simulator.simulate_transaction(
            journey_id=str(uuid.uuid4()),
            customer_name=customer_name,
            total_amount=total_amount,
            scenario=scenario
        )

        results.append(result)

        # Small delay between simulations
        await asyncio.sleep(0.1)

    summary = {
        "total_transactions": count,
        "successful": len([r for r in results if r["status"] == "completed"]),
        "failed": len([r for r in results if r["status"] in ["failed", "partial_failure"]]),
        "compensated": len([r for r in results if r["status"] == "compensated"]),
        "dlq_items": sum(len(r.get("dlq_items", [])) for r in results)
    }

    return {
        "success": True,
        "summary": summary,
        "simulations": results
    }


@router.get("/scenarios")
async def get_available_scenarios():
    """Get list of available simulation scenarios."""
    return {
        "scenarios": [
            {
                "name": "success",
                "description": "All steps complete successfully",
                "outcome": "Transaction completes without any issues"
            },
            {
                "name": "partial_failure",
                "description": "Transport booking fails midway",
                "outcome": "Previous steps are rolled back, some compensations may fail"
            },
            {
                "name": "payment_failure",
                "description": "Payment processing fails",
                "outcome": "All previous bookings are cancelled, full rollback"
            },
            {
                "name": "hotel_unavailable",
                "description": "Hotel booking fails - no availability",
                "outcome": "Flight is cancelled, compensation may fail (DLQ)"
            },
            {
                "name": "flight_cancelled",
                "description": "Flight booking fails immediately",
                "outcome": "Transaction fails without completion"
            }
        ]
    }

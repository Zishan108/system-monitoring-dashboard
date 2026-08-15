"""
alert_service.py
=================

Threshold-based alerting, layered on top of the existing metrics loop.

DESIGN: EDGE-TRIGGERED, NOT LEVEL-TRIGGERED
If we alerted every single tick a metric is over its threshold, at a
1-second broadcast interval you'd get one alert PER SECOND for as long as
CPU stays high — a spam storm, not a useful signal. Real monitoring tools
alert on the TRANSITION: the moment a metric crosses from under-threshold
to over-threshold, and again when it recovers back under. We track the
previous state per metric to detect that transition.
"""

from datetime import datetime, timezone

# In-memory thresholds. No auth in this project, so these are global
# settings anyone using the dashboard can see/change — fine for a solo
# portfolio demo. If auth gets added later, this becomes per-user rows
# in the database instead of one shared dict.
_thresholds = {
    "cpu": 80.0,
    "memory": 85.0,
    "disk": 90.0,
}

# Tracks whether each metric was ALREADY over its threshold on the
# previous check — this is what makes alerting edge-triggered instead
# of firing every single tick.
_state = {
    "cpu": False,
    "memory": False,
    "disk": False,
}


def get_thresholds():
    return dict(_thresholds)


def set_thresholds(new_thresholds: dict):
    for key in ("cpu", "memory", "disk"):
        if key in new_thresholds and new_thresholds[key] is not None:
            _thresholds[key] = float(new_thresholds[key])
    return get_thresholds()


def check_thresholds(metrics: dict):
    """
    Returns a list of alert dicts for any metric that just CROSSED a
    threshold since the last check — either exceeded it, or recovered
    back under it. Returns an empty list on ticks where nothing changed.
    """
    alerts = []
    current_values = {
        "cpu": metrics["cpu"]["usage_percent"],
        "memory": metrics["memory"]["usage_percent"],
        "disk": metrics["disk"]["usage_percent"],
    }

    for metric, value in current_values.items():
        threshold = _thresholds[metric]
        is_over = value >= threshold
        was_over = _state[metric]

        if is_over and not was_over:
            alerts.append({
                "metric": metric,
                "severity": "warning",
                "message": f"{metric.upper()} usage exceeded {threshold:.0f}%",
                "value": round(value, 1),
                "threshold": threshold,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        elif was_over and not is_over:
            alerts.append({
                "metric": metric,
                "severity": "resolved",
                "message": f"{metric.upper()} usage back under {threshold:.0f}%",
                "value": round(value, 1),
                "threshold": threshold,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        _state[metric] = is_over

    return alerts
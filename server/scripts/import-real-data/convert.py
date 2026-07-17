"""
Converts the Datameet open Indian Railways dataset (stations.json, trains.json)
into clean CSVs ready for import into the app's Postgres schema.

Source dataset: https://github.com/datameet/railways
Originally sourced from data.gov.in (Government of India Open Data Platform).
This is real train/station identity data — NOT live seat availability, which
isn't published anywhere publicly (IRCTC/NTES have no public API).

Usage:
  1. git clone https://github.com/datameet/railways.git
  2. python3 convert.py /path/to/railways
     (writes stations.csv, trains.csv, routes.csv into the current directory)
"""

import json
import csv
import sys
import os

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 convert.py /path/to/railways-repo")
        sys.exit(1)

    repo_path = sys.argv[1]

    with open(os.path.join(repo_path, "stations.json")) as f:
        stations = json.load(f)["features"]

    with open(os.path.join(repo_path, "trains.json")) as f:
        trains = json.load(f)["features"]

    # --- Stations ---
    valid_stations = {}
    for s in stations:
        p = s["properties"]
        code = p.get("code")
        name = p.get("name")
        if code and name and not code.startswith("XX-"):
            valid_stations[code] = {
                "code": code,
                "name": name.strip().title(),
                "city": (p.get("state") or "").strip(),
            }

    with open("stations.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["code", "name", "city"])
        writer.writeheader()
        writer.writerows(valid_stations.values())

    # --- Trains + minimal routes (source -> destination only) ---
    seen_numbers = set()
    clean_trains = []
    for t in trains:
        p = t["properties"]
        number = p.get("number")
        from_code = p.get("from_station_code")
        to_code = p.get("to_station_code")

        if not number or number in seen_numbers:
            continue
        if from_code not in valid_stations or to_code not in valid_stations:
            continue

        classes = {
            "SL": bool(p.get("sleeper")),
            "3A": bool(p.get("third_ac")),
            "2A": bool(p.get("second_ac")),
            "1A": bool(p.get("first_ac")),
            "CC": bool(p.get("chair_car")),
        }
        if not any(classes.values()):
            continue  # skip unreserved/local trains with no class data

        seen_numbers.add(number)
        clean_trains.append({
            "number": number,
            "name": (p.get("name") or "").strip(),
            "source_code": from_code,
            "destination_code": to_code,
            "distance_km": p.get("distance") or 0,
            "duration_min": (p.get("duration_h") or 0) * 60 + (p.get("duration_m") or 0),
            "sl": classes["SL"],
            "ac3": classes["3A"],
            "ac2": classes["2A"],
            "ac1": classes["1A"],
            "cc": classes["CC"],
        })

    with open("trains.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "number", "name", "source_code", "destination_code",
            "distance_km", "duration_min", "sl", "ac3", "ac2", "ac1", "cc",
        ])
        writer.writeheader()
        writer.writerows(clean_trains)

    print(f"Wrote stations.csv ({len(valid_stations)} stations)")
    print(f"Wrote trains.csv ({len(clean_trains)} trains with real class data)")

if __name__ == "__main__":
    main()

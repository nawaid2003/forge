import csv
import json
import random
from faker import Faker

fake = Faker()

# Generate clients
clients = [
    {
        "ClientID": f"C{i:03d}",
        "ClientName": fake.company(),
        "PriorityLevel": random.randint(1, 5),
        "RequestedTaskIDs": ",".join([f"T{random.randint(1, 20):03d}" for _ in range(random.randint(1, 3))]),
        "GroupTag": random.choice(["Premium", "Standard", "Basic"]),
        "AttributesJSON": json.dumps({"region": random.choice(["North", "South", "East", "West"])}),
    }
    for i in range(1, 21)
]
# Add edge case: duplicate ClientID
clients.append({**clients[0], "ClientName": "Duplicate Client"})

# Generate workers
workers = [
    {
        "WorkerID": f"W{i:03d}",
        "WorkerName": fake.name(),
        "Skills": ",".join(random.sample(["Java", "Python", "SQL", "AI", "DevOps"], random.randint(2, 4))),
        "AvailableSlots": ",".join(map(str, random.sample(range(1, 10), random.randint(2, 5)))),
        "MaxLoadPerPhase": random.randint(2, 5),
        "WorkerGroup": random.choice(["Tech", "Sales", "Support"]),
        "QualificationLevel": random.randint(1, 3),
    }
    for i in range(1, 21)
]

# Generate tasks
tasks = [
    {
        "TaskID": f"T{i:03d}",
        "TaskName": f"Task {fake.word().capitalize()}",
        "Category": random.choice(["Development", "Testing", "Deployment"]),
        "Duration": random.randint(1, 5),
        "RequiredSkills": ",".join(random.sample(["Java", "Python", "SQL", "AI"], random.randint(1, 3))),
        "PreferredPhases": ",".join(map(str, random.sample(range(1, 5), random.randint(1, 3)))),
        "MaxConcurrent": random.randint(1, 3),
    }
    for i in range(1, 21)
]
# Add edge case: invalid JSON
clients.append({
    "ClientID": "C999",
    "ClientName": "Invalid JSON Client",
    "PriorityLevel": 3,
    "RequestedTaskIDs": "T001,T002",
    "GroupTag": "Test",
    "AttributesJSON": "{invalid: json}",
})

# Write to CSV
def write_csv(filename, data):
    with open(f"samples/{filename}", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

write_csv("clients.csv", clients)
write_csv("workers.csv", workers)
write_csv("tasks.csv", tasks)
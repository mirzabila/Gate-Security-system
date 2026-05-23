# Permanent Deployment on Render

This folder is prepared for permanent hosting on Render.

## What Render Will Use

- Build command: `pip install -r desktop_requirements_deploy.txt`
- Start command: `python desktop_app.py`
- Health check: `/health`
- Runtime: Python 3.11.9
- Database storage: SQLite file on Render persistent disk at `/var/data/desktop_gate_alert.db`

## Deploy Steps

1. Create or sign in to a Render account.
2. Upload this `Security System` folder to a GitHub repository.
3. In Render, choose **New +** then **Blueprint**.
4. Connect the GitHub repository.
5. Select the `render.yaml` file from this folder.
6. Click **Apply** / **Deploy**.

Render will generate a permanent HTTPS URL like:

`https://baig-house-gate-security-system.onrender.com`

## Important Security Step

After deployment, change the default admin password before sharing the link.

Default local login:

- Name: `Mirza Bilal`
- Password: `admin@gate2024`
- Admin PIN: `1234`

## Notes

- The free Render plan does not support persistent disks. Use a paid web service plan if you want the SQLite database to persist permanently.
- If you use the free plan without a disk, the app can run, but database data may reset after restarts/deploys.

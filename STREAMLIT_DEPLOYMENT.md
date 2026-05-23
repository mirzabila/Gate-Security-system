# Streamlit Deployment

This single-folder project is ready for Streamlit Community Cloud.

## Streamlit Cloud Settings

- Repository: your GitHub repository
- Branch: `main`
- Main file path: `streamlit_app.py`
- Dependencies file: `requirements.txt`
- Python version: Streamlit Cloud default is OK. If you can choose it, Python 3.12 is also safe.

## Deploy Steps

1. Upload all files in this `security system` folder to a GitHub repository.
2. Go to Streamlit Community Cloud.
3. Click **Create app**.
4. Select your repository and branch.
5. Set the main file path to `streamlit_app.py`.
6. Deploy.

Streamlit will generate a permanent public URL ending in:

`streamlit.app`

## Default Login

- Name: `Mirza Bilal`
- Password: `admin@gate2024`
- Admin PIN: `1234`

## Important Notes

- Streamlit Community Cloud storage is not guaranteed permanent for SQLite data. The app will run, but database data may reset after app rebuilds or restarts.
- Change the default password before sharing your deployed link.
- This Streamlit version uses a Streamlit-native dashboard. It does not require the FastAPI server to run separately.
- If Streamlit Cloud shows a SQLAlchemy `AssertionError` on Python 3.14, make sure your deployed repository has `sqlalchemy>=2.0.44,<2.1` in `requirements.txt`, then reboot or redeploy the app.

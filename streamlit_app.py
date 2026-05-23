import secrets
from datetime import date

import streamlit as st
from passlib.context import CryptContext

import desktop_models as models
from desktop_database import Base, SessionLocal, engine


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SUPER_ADMIN_NAME = "Mirza Bilal"
FAMILY_ADMINS = [
    "Iftikhar Mehmood",
    "Sajid Mehmood",
    "Majid Mehmood",
    "Mirza Younas",
    "Mirza Yousaf",
    "Iftikhar Najmi",
    "Ghiyour Asif",
    "Khalil Baig",
]


st.set_page_config(
    page_title="Baig House Gate Security System",
    page_icon="BG",
    layout="wide",
)


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def seed_defaults(db):
    admin = db.query(models.User).filter(
        models.User.role == models.UserRole.SUPER_ADMIN,
    ).first()
    if admin:
        return

    db.add(models.SuperKey(key_value=secrets.token_hex(16), max_devices=50))
    admin = models.User(
        name=SUPER_ADMIN_NAME,
        role=models.UserRole.SUPER_ADMIN,
        password_hash=hash_password("admin@gate2024"),
    )
    db.add(admin)
    db.flush()

    for name in FAMILY_ADMINS:
        family = models.Family(
            name=f"{name.split()[0]} Family",
            admin_name=name,
            invite_key=secrets.token_hex(12),
            max_devices=4,
        )
        db.add(family)
        db.flush()
        db.add(models.User(
            name=name,
            role=models.UserRole.FAMILY_ADMIN,
            password_hash=hash_password("admin@gate2024"),
            family_id=family.id,
        ))

    db.commit()


def role_label(role):
    value = getattr(role, "value", str(role))
    return {
        "super_admin": "Super Admin",
        "family_admin": "Family Admin",
        "member": "Member",
    }.get(value, value)


def get_user(db):
    user_id = st.session_state.get("user_id")
    if not user_id:
        return None
    return db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True,
    ).first()


def show_login(db):
    st.title("Baig House Gate Security System")
    st.caption("Secure family gate alert dashboard")

    login_tab, register_tab = st.tabs(["Sign in", "Register"])

    with login_tab:
        with st.form("login_form"):
            name = st.text_input("Name", placeholder="Mirza Bilal")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign in", use_container_width=True)

        if submitted:
            user = db.query(models.User).filter(models.User.name == name.strip()).first()
            if user and user.is_active and verify_password(password, user.password_hash):
                st.session_state.user_id = user.id
                st.rerun()
            else:
                st.error("Invalid name or password.")

    with register_tab:
        with st.form("register_form"):
            reg_name = st.text_input("Full name")
            invite_key = st.text_input("Invite key")
            reg_password = st.text_input("New password", type="password")
            confirm = st.text_input("Confirm password", type="password")
            submitted = st.form_submit_button("Create account", use_container_width=True)

        if submitted:
            if not reg_name.strip() or not invite_key.strip() or not reg_password:
                st.error("All fields are required.")
            elif reg_password != confirm:
                st.error("Passwords do not match.")
            elif db.query(models.User).filter(models.User.name == reg_name.strip()).first():
                st.error("That name is already taken.")
            else:
                family = db.query(models.Family).filter(
                    models.Family.invite_key == invite_key.strip(),
                    models.Family.is_active == True,
                ).first()
                super_key = db.query(models.SuperKey).filter(
                    models.SuperKey.key_value == invite_key.strip(),
                    models.SuperKey.is_active == True,
                ).first()
                if not family and not super_key:
                    st.error("Invalid invite key.")
                else:
                    user = models.User(
                        name=reg_name.strip(),
                        role=models.UserRole.MEMBER,
                        password_hash=hash_password(reg_password),
                        family_id=family.id if family else None,
                    )
                    db.add(user)
                    db.commit()
                    st.session_state.user_id = user.id
                    st.success("Account created.")
                    st.rerun()


def show_home(db, user):
    st.header("Gate Dashboard")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Families", db.query(models.Family).count())
    c2.metric("Users", db.query(models.User).filter(models.User.is_active == True).count())
    c3.metric("Devices", db.query(models.Device).filter(models.Device.is_active == True).count())
    c4.metric("Gate events", db.query(models.GateEvent).count())

    st.subheader("Trigger Gate Alert")
    with st.form("gate_trigger_form"):
        message = st.text_input("Alert message", value="Someone is at the gate!")
        submitted = st.form_submit_button("Trigger alert", type="primary")

    if submitted:
        event = models.GateEvent(triggered_by=user.name, message=message.strip() or "Someone is at the gate!")
        db.add(event)
        db.flush()
        users = db.query(models.User).filter(models.User.is_active == True).all()
        for target in users:
            db.add(models.Notification(
                user_id=target.id,
                title="Gate Alert",
                body=f"{user.name}: {event.message}",
            ))
        db.commit()
        st.success("Gate alert created for all active users.")
        st.rerun()

    st.subheader("Recent Events")
    events = db.query(models.GateEvent).order_by(models.GateEvent.created_at.desc()).limit(25).all()
    if not events:
        st.info("No gate events yet.")
    for event in events:
        with st.container(border=True):
            cols = st.columns([3, 2, 2, 1])
            cols[0].write(event.message)
            cols[1].write(f"By: {event.triggered_by}")
            cols[2].write(event.created_at)
            if event.acknowledged:
                cols[3].success("Handled")
            elif cols[3].button("Handle", key=f"ack_{event.id}"):
                event.acknowledged = True
                event.ack_by = user.id
                db.commit()
                st.rerun()


def show_admin(db, user):
    st.header("Administration")
    if user.role not in (models.UserRole.SUPER_ADMIN, models.UserRole.FAMILY_ADMIN):
        st.warning("Admin access required.")
        return

    if user.role == models.UserRole.SUPER_ADMIN:
        key = db.query(models.SuperKey).filter(models.SuperKey.is_active == True).first()
        if key:
            st.text_input("Super invite key", value=key.key_value, disabled=True)
            if st.button("Regenerate super key"):
                key.is_active = False
                db.add(models.SuperKey(key_value=secrets.token_hex(16), max_devices=50))
                db.commit()
                st.rerun()

        st.subheader("Create Family")
        with st.form("family_form"):
            family_name = st.text_input("Family name")
            admin_name = st.text_input("Admin name")
            max_devices = st.number_input("Max devices", min_value=1, max_value=100, value=4)
            submitted = st.form_submit_button("Create family")
        if submitted:
            if family_name.strip() and admin_name.strip():
                family = models.Family(
                    name=family_name.strip(),
                    admin_name=admin_name.strip(),
                    invite_key=secrets.token_hex(12),
                    max_devices=int(max_devices),
                )
                db.add(family)
                db.commit()
                st.success("Family created.")
                st.rerun()
            else:
                st.error("Family name and admin name are required.")

        st.subheader("Families")
        families = db.query(models.Family).order_by(models.Family.created_at.desc()).all()
        for family in families:
            members = db.query(models.User).filter(models.User.family_id == family.id).count()
            devices = db.query(models.Device).filter(
                models.Device.family_id == family.id,
                models.Device.is_active == True,
            ).count()
            with st.container(border=True):
                st.write(f"**{family.name}** | Admin: {family.admin_name}")
                st.write(f"Invite key: `{family.invite_key}`")
                st.write(f"Members: {members} | Devices: {devices}/{family.max_devices} | Active: {family.is_active}")
    else:
        st.subheader("Family Users")
        users = db.query(models.User).filter(models.User.family_id == user.family_id).all()
        for row in users:
            st.write(f"{row.name} - {role_label(row.role)} - {'active' if row.is_active else 'inactive'}")


def show_schedule(db, user):
    st.header("Availability Schedule")
    with st.form("schedule_form"):
        selected = st.date_input("Date", value=date.today())
        unavailable = st.checkbox("Unavailable on this date", value=True)
        note = st.text_input("Note")
        submitted = st.form_submit_button("Save schedule")
    if submitted:
        date_text = selected.isoformat()
        entry = db.query(models.Schedule).filter(
            models.Schedule.user_id == user.id,
            models.Schedule.date == date_text,
        ).first()
        if not entry:
            entry = models.Schedule(user_id=user.id, family_id=user.family_id, date=date_text)
            db.add(entry)
        entry.unavailable = unavailable
        entry.note = note.strip() or None
        db.commit()
        st.success("Schedule saved.")

    rows = db.query(models.Schedule).filter(
        models.Schedule.user_id == user.id,
    ).order_by(models.Schedule.date.desc()).limit(50).all()
    for row in rows:
        st.write(f"{row.date} - {'Unavailable' if row.unavailable else 'Available'} - {row.note or ''}")


def show_notifications(db, user):
    st.header("Notifications")
    if st.button("Mark all as read"):
        db.query(models.Notification).filter(
            models.Notification.user_id == user.id,
            models.Notification.is_read == False,
        ).update({"is_read": True})
        db.commit()
        st.rerun()

    rows = db.query(models.Notification).filter(
        models.Notification.user_id == user.id,
    ).order_by(models.Notification.created_at.desc()).limit(50).all()
    if not rows:
        st.info("No notifications yet.")
    for row in rows:
        with st.container(border=True):
            st.write(f"**{row.title}**")
            st.write(row.body)
            st.caption(row.created_at)
            if not row.is_read and st.button("Mark read", key=f"read_{row.id}"):
                row.is_read = True
                db.commit()
                st.rerun()


def show_profile(user):
    st.header("Profile")
    st.write(f"Name: **{user.name}**")
    st.write(f"Role: **{role_label(user.role)}**")
    st.write(f"User ID: `{user.id}`")


def main():
    init_db()
    db = SessionLocal()
    try:
        user = get_user(db)
        if not user:
            show_login(db)
            return

        st.sidebar.title("Baig House")
        st.sidebar.write(user.name)
        st.sidebar.caption(role_label(user.role))
        if st.sidebar.button("Sign out"):
            st.session_state.clear()
            st.rerun()

        pages = ["Home", "Schedule", "Notifications", "Profile"]
        if user.role in (models.UserRole.SUPER_ADMIN, models.UserRole.FAMILY_ADMIN):
            pages.insert(1, "Admin")
        page = st.sidebar.radio("Navigation", pages)

        if page == "Home":
            show_home(db, user)
        elif page == "Admin":
            show_admin(db, user)
        elif page == "Schedule":
            show_schedule(db, user)
        elif page == "Notifications":
            show_notifications(db, user)
        elif page == "Profile":
            show_profile(user)
    finally:
        db.close()


if __name__ == "__main__":
    main()

import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Noise Dashboard</div>

      <div className={styles.links}>
        <NavLink
          to="/realtime"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
        >
          Real-time
        </NavLink>

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
        >
          History
        </NavLink>

        <NavLink
          to="/testlinechart"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
        >
          Line Chart
        </NavLink>

        <NavLink
          to="/demo"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
        >
          Map Demo
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;

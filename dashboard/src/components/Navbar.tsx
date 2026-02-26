import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Noise Dashboard</div>

      <div className={styles.links}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? styles.activeLink : styles.link
          }
        >
          Home
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

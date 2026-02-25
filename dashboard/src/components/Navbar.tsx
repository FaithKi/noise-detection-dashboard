import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
	return (
		<>
			<div className={styles.navbar}>
				<p>I am Navbar</p>
				<Link to="/">Home</Link>
				<Link to="/testlinechart">Line Chart</Link>
			</div>
		</>
	);
};

export default Navbar;

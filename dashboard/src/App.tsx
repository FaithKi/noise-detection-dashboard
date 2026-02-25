import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./page/Home";
import TestLineChart from "./page/TestLineChart";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
	    <BrowserRouter>
	   		<Navbar />
	      	<Routes>
	        	<Route path="/" element={<Home />} />
	        	<Route path="/testlinechart" element={<TestLineChart />} />
	      	</Routes>
	    </BrowserRouter>
    </>
  )
}

export default App

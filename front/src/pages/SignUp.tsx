import { Navigate } from "react-router-dom";

const SignUp = () => {
  // Redirect to home page - Web3Auth modal can be triggered from navbar
  return <Navigate to="/" replace />;
};

export default SignUp;
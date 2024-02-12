import { useState } from "react";

type OnLoginCallback = () => void;

type Props = {
  onLogin: OnLoginCallback;
};

function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");

  const handleLogin = () => {
    // Perform authentication logic here
    // For simplicity, I'm just checking if username is not empty
    if (username.trim() !== "") {
      // Call the onLogin callback to notify the parent component
      onLogin();
    } else {
      // Handle invalid login
      alert("Please enter username and password");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;

import { useState } from "react";

type OnLoginCallback = (username: string) => void;

type Props = {
  onLogin: OnLoginCallback;
};

function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");

  const handleLogin = () => {
    // For simplicity, I'm just checking if username is not empty
    if (username.trim() !== "") {
      // Call the onLogin callback to notify the parent component
      onLogin(username);
    } else {
      alert("Please enter username");
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

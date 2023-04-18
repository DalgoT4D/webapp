import { useState } from 'react';
import { signIn } from 'next-auth';
import { redirect } from 'next/dist/server/api-utils';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onUsernameChange = (event: any) => {
    console.log('value', event.target.value);
    setUsername(event.target.value);
  };

  const onPasswordChange = (event: any) => {
    console.log('value', event.target.value);
    setPassword(event.target.value);
  };

  const onSubmit = async () => {
    const result = await signIn('credentials', {
      username: username,
      password: password,
      redirect: true,
      callbackUrl: '/',
    });
    console.log(result);
  };

  return (
    <div>
      <h1>Login</h1>
      <div>
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={username}
          onChange={onUsernameChange}
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={onPasswordChange}
        />
      </div>
      <div>
        <button onClick={onSubmit}>Login</button>
      </div>
    </div>
  );
};

export default Login;

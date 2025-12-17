import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to your CoinFlow account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Email"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <Button type="submit" variant="primary" className="mt-2 text-lg">
                        Sign In
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            const res = await googleLogin();
                            if (res.success) navigate('/');
                            else setError(res.error);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                    >
                        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M12.0003 20.45c4.656 0 8.568-3.324 9.656-7.776h-9.656v-3.648h14.112c.144.696.216 1.44.216 2.232 0 6.6-4.416 11.28-10.992 11.28-6.072 0-11.016-4.512-11.664-10.32h-3.48v5.52c1.776 3.528 5.4 5.712 9.808 5.712z" fill="#34A853" />
                            <path d="M12.0003 3.54999c2.376 0 4.512.84 6.192 2.232l3.48-3.48C19.3443.46599 15.9363-.44601 12.0003-.44601c-4.416 0-8.04 2.184-9.816 5.712l3.48 5.52c.672-5.784 5.616-10.236 11.664-10.236z" fill="#EA4335" />
                            <path d="M.480286 6.36c-1.8 3.528-1.8 7.752 0 11.28l4.152-4.8c-.528-1.824-.528-3.816 0-5.64l-4.152-4.8z" fill="#FBBC05" />
                        </svg>
                        Google
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:underline font-semibold">
                        Sign up
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default LoginPage;

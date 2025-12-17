import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

const SignupPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await signup(firstName, lastName, email, password, image);
        if (res.success) {
            navigate('/');
        } else {
            console.error("Signup failed:", res.error);
            setError(res.error);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
                    <p className="text-slate-500 dark:text-slate-400">Join CoinFlow today</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <Input
                            label="First Name"
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                            className="w-full"
                        />
                        <Input
                            label="Last Name"
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profileImage" className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture (Optional)</label>
                        <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100
                            "
                        />
                    </div>
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
                        Sign Up
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                        Log in
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default SignupPage;

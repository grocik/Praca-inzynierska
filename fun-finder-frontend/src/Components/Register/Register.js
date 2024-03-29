import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useAuth } from '../../Utils/AuthProvider';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { serialize } from 'cookie';
import "./Register.css";
import registerImg from "./Images/register-img.png";

const Register = () => {
    const navigate = useNavigate();
    const { isLoggedIn, login } = useAuth();

    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isLoggedIn) {
            navigate("/");
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        let strength = 0;
        if (formData.password.length >= 8) {
            strength += 1;
        }
        if (/\d/.test(formData.password)) {
            strength += 1;
        }
        if (/[A-Z]/.test(formData.password)) {
            strength += 1;
        }
        if (/[!@#$%^&*]/.test(formData.password)) {
            strength += 1;
        }
        setPasswordStrength(strength);
    }, [formData.password]);

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 1) {
            return "red";
        } else if (passwordStrength === 2 || passwordStrength === 3) {
            return "orange";
        } else if (passwordStrength === 4) {
            return "green";
        }
    };

    const validateForm = () => {
        setError(null);

        if (
            formData.fname.trim() === "" ||
            formData.lname.trim() === "" ||
            formData.email.trim() === "" ||
            formData.password === "" ||
            formData.confirmPassword === ""
        ) {
            setError("Wszystkie pola są wymagane.");
            return false;
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Nieprawidłowy adres email.");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Hasła nie pasują do siebie.");
            return false;
        }

        if (passwordStrength < 4) {
            setError("Hasło nie jest wystarczająco silne.");
            return false;
        }

        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isFormValid = validateForm();

        if (isFormValid) {
            try {
                const { confirmPassword, ...restFormData } = formData;
                await axios.post('http://localhost:7000/users/register', restFormData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                navigate('/login');
            } catch (error) {
                setError("Użytkownik o tym adresie email już istnieje!")
                console.error('Błąd podczas wysyłania danych do serwera:', error.message);
            }
        }
    };


    const handleLoginSuccess = async (credentialResponse) => {
        try {
          const decodedToken = jwtDecode(credentialResponse.credential);
      
          if (!decodedToken) {
            console.error('Failed to decode JWT token.');
            return;
          }
      
          const adaptedUser = {
            email: decodedToken.email,
            given_name: decodedToken.given_name,
            family_name: decodedToken.family_name,
          };
      
          document.cookie = serialize('accessToken', credentialResponse.credential, { path: '/', maxAge: 3600 });
      
          const response = await axios.post('http://localhost:7000/users/register-google', adaptedUser);
      
          if (response.status === 201) {
            await login(response.data.user);
            navigate("/profile");
          } else {
            console.error('Failed to register user:', response.statusText);
          }
        } catch (error) {
          console.error('Error decoding JWT token or registering user:', error);
        }
      };

    const handleLoginError = () => {
        console.log('Login Failed');
    };

    return (
        <div className="register-container">
            <img className="mobile-only-image" src={registerImg} alt="Register"/>
            <div className="welcomeText-container">
                <h1>Poznawaj ludzi z FunFinder!</h1>
                <p>Utwórz konto i zacznij spędzać niezapomniane chwile</p>
            </div>

            <div className="registerForm-container">
                <h3>Zajerestruj się</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="text"
                            name="fname"
                            placeholder="Imię"
                            value={formData.fname}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            name="lname"
                            placeholder="Nazwisko"
                            value={formData.lname}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="E-mail"
                            value={formData.email}
                            onChange={handleInputChange}

                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            placeholder="Hasło"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Powtórz hasło"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="password-strength">

                        <div
                            className="progress-bar"
                            style={{
                                width: `${(passwordStrength / 4) * 100}%`,
                                backgroundColor: getPasswordStrengthColor(),
                            }}
                        />

                    </div>
                    <div className="error-message">{error}</div>
                    <div className="registerSubmitButton">
                        <button type="submit">Zarejestruj</button>
                    </div>
                    <div className="google-login-button-container-register">
                        <GoogleLogin
                            buttonText="Zaloguj się z Google"
                            onSuccess={handleLoginSuccess}
                            onError={handleLoginError}
                            render={renderProps => (
                                <button
                                    onClick={renderProps.onClick}
                                    disabled={renderProps.disabled}
                                    className="google-login-button" 
                                >
                                    Zaloguj się z Google
                                </button>
                            )}
                        />
                    </div>
                </form>
            </div>
        </div>

    );
}

export default Register;
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mockAxios = new MockAdapter(axios);

describe('App component', () => {

  beforeEach(() => {
    mockAxios.reset();
  });

  it('renders welcome message', () => {
    render(<App />);
    const welcomeMessage = screen.getByText(/Welcome to our Quiz game!/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  it('renders Login component by default', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('navigates to register view when "Don\'t have an account?" is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i }));
    expect(screen.getByRole('heading', { name: /Add User/i })).toBeInTheDocument();
  });

  it('navigates to login view when "Already have an account?" is clicked', () => {
    
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i })); // Go to registration page
    fireEvent.click(screen.getByRole('button', { name: /Already have an account?/i })); // Go to login page
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  });

  it('navigates to Home view after successful login', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, { success: true }); // Mock a successful login

    render(<App />);
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
    fireEvent.click(loginButton);

    // Technically depends on Login.js working properly.
    // To keep it simple, and since Login is not tested here, 
    // only whether the Home page is rendered or not will be checked.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    });
  });

  it('navigates to Home view after successful registration', async() => {
    mockAxios.onPost('http://localhost:8000/adduser').reply(200, { success: true }); // Mock a successful registration

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i })); // Go to registration page

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
    fireEvent.click(addUserButton);

    // Same situation as the Login, only whether the Home page is
    // rendered or not will be checked.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    });
  });
});
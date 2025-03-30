import React from 'react';
import {render, fireEvent, screen, waitFor, act} from '@testing-library/react';
import App from './App';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {MemoryRouter} from "react-router-dom";

const mockAxios = new MockAdapter(axios);

describe('App component', () => {

  const fillLoginFormAndSubmit = async (type) => {
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testUser' } });
      fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
      fireEvent.click(type);
    });
  };

  beforeEach(() => {
    mockAxios.reset();
  });

  it('renders Login component by default', () => {
    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('navigates to register view when "Don\'t have an account?" is clicked', () => {
    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i }));
    expect(screen.getByRole('heading', { name: /Add User/i })).toBeInTheDocument();
  });

  it('navigates to login view when "Already have an account?" is clicked', () => {
    
    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i })); // Go to registration page
    fireEvent.click(screen.getByRole('button', { name: /Already have an account?/i })); // Go to login page
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
  });

  it('navigates to Home view after successful login', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, { success: true }); // Mock a successful login

    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );

    await fillLoginFormAndSubmit(screen.getByRole('button', {name: /Login/i}));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome back!/i})).toBeInTheDocument();
    });
  });

  it('navigates to Login view after successful registration', async() => {
    mockAxios.onPost('http://localhost:8000/adduser').reply(200, { success: true }); // Mock a successful registration

    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Don't have an account?/i })); // Go to registration page

    await fillLoginFormAndSubmit(screen.getByRole('button', {name: /Add User/i}));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });
  });
});
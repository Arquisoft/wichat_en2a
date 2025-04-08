import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('AddUser component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear(); // Clear mock before the start of each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
  });

  it('should disable the Add User button when inputs are empty', () => {
    render(
        <MemoryRouter>
          <AddUser />
        </MemoryRouter>
    );

    const addUserButton = screen.getByRole('button', { name: /Register/i });
    expect(addUserButton).toBeDisabled();
  });

  it('should add user successfully and navigate to login', async () => {
    render(
        <MemoryRouter>
          <AddUser />
        </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Register/i });

    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    fireEvent.click(addUserButton);

    await waitFor(() => {
      expect(screen.getByText(/Register successful/i)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

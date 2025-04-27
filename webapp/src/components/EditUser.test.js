import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditUser from './EditUser';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock de useAuth
jest.mock('./AuthContext', () => ({
    useAuth: () => ({
        logout: jest.fn(),
        user: { username: 'mockuser', profilePicture: '/avatars/default.jpg' },
    }),
}));

// Mock de axios
jest.mock('axios');


// Mock de axios
jest.mock('axios');

describe('EditUser Component', () => {

    beforeEach(() => {
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'username') return 'mockeduser';
            if (key === 'profilePic') return '/avatars/default.jpg';
            if (key === 'userId') return '123';
            return null;
        });

        axios.put.mockResolvedValue({ data: { success: true } });
        jest.clearAllMocks();
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    const setup = () => {
        return render(
            <BrowserRouter>
                <EditUser />
            </BrowserRouter>
        );
    };

    test('fields are created correctly', () => {
        setup();

        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    });

    test('allows username change', () => {
        setup();

        const usernameInput = screen.getByLabelText(/username/i);
        fireEvent.change(usernameInput, { target: { value: 'newusername' } });

        expect(usernameInput.value).toBe('newusername');
    });

    test('opens avatar selector', () => {
        setup();

        const avatar = screen.getByAltText('UserBigPic');
        fireEvent.click(avatar);
        expect(screen.getAllByAltText('Option for avatar').length).toBeGreaterThan(1);
    });

    test('allows to select an avatar', () => {
        setup();

        fireEvent.click(screen.getByAltText('UserBigPic'));
        const avatars = screen.getAllByAltText('Option for avatar');
        fireEvent.click(avatars[1]); // choose first avatar in the list

        const mainAvatar = screen.getByAltText('UserBigPic');
        expect(mainAvatar).toHaveAttribute('src', '/avatars/avatar2.jpg');
    });

    test('save changes and navigate', async () => {
        setup();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'updateduser' } });

        const saveButton = screen.getByText(/save changes/i);
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                'http://localhost:8000/users/123',
                expect.objectContaining({
                    username: 'updateduser',
                    profilePicture: '/avatars/default.jpg',
                })
            );
        });

        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    test('handle errors after saving', async () => {
        axios.put.mockRejectedValueOnce(new Error('Error on update'));

        setup();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'updateduser' } });

        fireEvent.click(screen.getByText(/save changes/i));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to save changes.');
        });
    });

});

import {render, fireEvent, screen} from '@testing-library/react';
import Navbar from './Navbar';
import {MemoryRouter} from 'react-router-dom';
import {AuthProvider} from "./AuthContext";
import React from "react";

//useNavigate Mock
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('Navbar component', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        mockNavigate.mockClear(); // Reset the mock before each test
        jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    });

    const renderNavbarComponent = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <Navbar />
                </MemoryRouter>
            </AuthProvider>
        );
    };

    it('renders all navigation buttons', () => {
        renderNavbarComponent();
        expect(screen.getByRole('button', {name: /Home/i})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /User Scores/i})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Leaderboards/i})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Log Out/i})).toBeInTheDocument();
    });

    it('navigates to "Home" when the Home button is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByRole('button', {name: /Home/i}));
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('navigates to "User Scores" when the User Scores button is clicked', () => {
        renderNavbarComponent()
        fireEvent.click(screen.getByRole('button', {name: /User Scores/i}));
        expect(mockNavigate).toHaveBeenCalledWith('/scores');
    });

    it('navigates to "Leaderboard" when the Leaderboard button is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByRole('button', {name: /Leaderboards/i}));
        expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
    });

    it('navigates to "Login" when the Logout button is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByRole('button', {name: /Log Out/i}));
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('navigates to "Game" when the Game button is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByRole('button', {name: /Game/i}));
        expect(mockNavigate).toHaveBeenCalledWith('/gamemodes');
    });

    it('navigates to "Home" when the logo is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByAltText('App Logo'));
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('navigates to "EditUser" when the logo is clicked', () => {
        renderNavbarComponent();
        fireEvent.click(screen.getByAltText('UserPic'));
        expect(mockNavigate).toHaveBeenCalledWith('/editUser');
    });

});

package com.rapidresponse.user;

record RegisterRequest(
        String fullName,
        String email,
        String phone,
        String bloodGroup,
        String emergencyContact,
        String password) {
}

record LoginRequest(String email, String password) {
}

record UserResponse(Long id, String fullName, String email, String phone, String bloodGroup, String emergencyContact) {
    static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getBloodGroup(),
                user.getEmergencyContact());
    }
}

record AuthResponse(String message, UserResponse user) {
}

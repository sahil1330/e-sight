export default interface User {
    _id: string | undefined;
    fullName: string | undefined;
    email: string | undefined;
    phone: string | undefined;
    role: string | undefined;
    isVerified: boolean | undefined;
    connectedUsers: [User] | undefined;
}

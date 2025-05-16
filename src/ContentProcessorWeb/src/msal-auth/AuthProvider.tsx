import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalInstance';

import AuthWrapper from './AuthWrapper';
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    return <>
        <MsalProvider instance={msalInstance}>
            <AuthWrapper>
                {children}
            </AuthWrapper>
        </MsalProvider>
    </>
};

export default AuthProvider;

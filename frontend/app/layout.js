import './globals.css';
import { VaultProvider } from '../context/VaultContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'SecureVault | Encrypted Password Manager',
  description: 'Zero-knowledge password manager with secure client-side encryption.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <VaultProvider>
          <Navbar />
          <main className="container animate-in">
            {children}
          </main>
        </VaultProvider>
      </body>
    </html>
  );
}

// app/layout.js
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'AI Image Generator (fal.ai)',
  description: 'Generate images using the fal.ai FLUX model'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

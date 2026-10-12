import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

const ADMIN_EMAIL = 'david.artavia.rodriguez@gmail.com'.toLowerCase();

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'wkf-2026-auth-secret-production-token-982143',
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return false;

      try {
        await dbConnect();
        const userEmail = user.email.toLowerCase();
        const isAdmin = userEmail === ADMIN_EMAIL;

        let existingUser = await User.findOne({ email: userEmail });

        if (!existingUser) {
          // Crear nuevo registro de usuario
          await User.create({
            name: user.name || 'Usuario',
            email: userEmail,
            image: user.image || '',
            role: isAdmin ? 'admin' : 'visitante',
            status: isAdmin ? 'aprobado' : 'pendiente',
            lastLogin: new Date(),
          });
        } else {
          // Actualizar datos de perfil y último acceso
          existingUser.name = user.name || existingUser.name;
          existingUser.image = user.image || existingUser.image;
          existingUser.lastLogin = new Date();

          // Asegurar que el correo del administrador siempre mantenga rol admin y activo
          if (isAdmin) {
            existingUser.role = 'admin';
            existingUser.status = 'aprobado';
          }

          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error('Error al sincronizar usuario con MongoDB en signIn:', error);
        // Permitir inicio de sesión incluso si hay un fallo temporal en la sincronización
        return true;
      }
    },

    async jwt({ token, user }) {
      if (token?.email) {
        try {
          await dbConnect();
          const userEmail = token.email.toLowerCase();
          const dbUser = await User.findOne({ email: userEmail });

          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.status = dbUser.status;
          } else if (userEmail === ADMIN_EMAIL) {
            token.role = 'admin';
            token.status = 'aprobado';
          } else {
            token.role = token.role || 'visitante';
            token.status = token.status || 'pendiente';
          }
        } catch (error) {
          console.error('Error al consultar usuario en jwt callback:', error);
          if (token.email.toLowerCase() === ADMIN_EMAIL) {
            token.role = 'admin';
            token.status = 'aprobado';
          } else {
            token.role = 'visitante';
            token.status = 'pendiente';
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        const isSuperAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL;
        session.user.role = isSuperAdmin ? 'admin' : (token.role || 'visitante');
        session.user.status = isSuperAdmin ? 'aprobado' : (token.status || 'pendiente');
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

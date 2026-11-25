/** Comprueba quién es la persona dueña de un access_token. Devuelve null si no es válido. */
export interface TokenVerifier {
  verify(accessToken: string): Promise<{ userId: string } | null>;
}

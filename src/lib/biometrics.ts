import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true; // Na web, ignora a biometria por enquanto
  }

  try {
    const result = await BiometricAuth.checkBiometry();

    // Na versão mais recente, verificamos se o tipo de biometria não é 'none'
    if (result.biometryType !== BiometryType.none) {
      try {
        await BiometricAuth.authenticate({
          reason: 'Acesse as atas sacramentais com segurança',
          cancelTitle: 'Cancelar',
        });
        return true; // Se não lançar erro, a autenticação foi bem-sucedida
      } catch (authError) {
        console.error('Falha na autenticação biométrica:', authError);
        return false;
      }
    }

    return true; // Se não houver biometria disponível, permite o acesso
  } catch (error) {
    console.error('Erro ao verificar biometria:', error);
    return false;
  }
}

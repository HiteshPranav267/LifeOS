import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const nativeHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }
};

export const nativeVibrate = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.vibrate();
        } catch (e) {
            console.warn('Vibration not available', e);
        }
    }
};

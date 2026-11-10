import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePtAo from '@angular/common/locales/pt-AO';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

registerLocaleData(localePtAo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Os interceptors (autenticação, hospital activo) são registados aqui nos próximos módulos.
    provideHttpClient(withFetch(), withInterceptors([])),
    { provide: LOCALE_ID, useValue: 'pt-AO' },
  ],
};

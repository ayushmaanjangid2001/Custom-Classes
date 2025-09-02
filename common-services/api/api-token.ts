import { InjectionToken } from '@angular/core';

/**
 * 
 * { provide: API_ENDPOINTS, useValue: Constants.POST_ERROR }
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL')
export const APP_UPDATE_XML_CONFIG_FILE = new InjectionToken<string>('APP_UPDATE_XML_CONFIG_FILE')
export const API_ENDPOINTS = new InjectionToken<string>('API_ENDPOINTS')
export const ENCRYPTED_KEY = new InjectionToken<string>('ENCRYPTED_KEY');
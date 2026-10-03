import Axios from 'axios';
import { createHash } from 'crypto';
import * as electron from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as qs from 'qs';

export interface ApiTicketResponse {
  ticket: string;
  characters: { [key: string]: number };
  default_character: number;
  error: string;
  request?: boolean;
}

interface CachedTicket extends ApiTicketResponse {
  issuedAt: number;
}

// F-List invalidates every previously issued ticket for an account the moment a
// new one is issued, so every tab should share a single ticket instead of
// fetching its own. Server-side lifetime is 30 minutes, so we refresh early so an
// acquired ticket can't expire while a tab is still connecting
const ticketLifetime = 25 * 60 * 1000;

const cache = new Map<string, CachedTicket>();
const inFlight = new Map<string, Promise<ApiTicketResponse>>();

// keyed on the credentials so that a wrong/changed password fails correctly
function credentialKey(account: string, password: string): string {
  return `${account}:${createHash('sha256').update(password).digest('hex')}`;
}

function errorResponse(error: string, request?: boolean): ApiTicketResponse {
  return { ticket: '', characters: {}, default_character: 0, error, request };
}

async function fetchTicket(
  key: string,
  account: string,
  password: string
): Promise<ApiTicketResponse> {
  log.debug('api.ticket.fetch', { account });

  try {
    const data = <Partial<ApiTicketResponse> & { error: string }>(
      await Axios.post(
        'https://www.f-list.net/json/getApiTicket.php',
        qs.stringify({
          account,
          password,
          no_friends: true,
          no_bookmarks: true,
          new_character_list: true
        })
      )
    ).data;

    if (data.ticket === undefined) {
      log.error('error.api.getTicket', { error: data.error });
      return errorResponse(data.error);
    }

    const ticket: CachedTicket = {
      ticket: data.ticket,
      characters: data.characters ?? {},
      default_character: data.default_character ?? 0,
      error: '',
      issuedAt: Date.now()
    };
    cache.set(key, ticket);

    return ticket;
  } catch (e) {
    log.error('error.api.getTicket', { error: (<Error>e).message });
    return errorResponse((<Error>e).message, true);
  }
}

/**
 * Returns the account's shared API ticket, fetching a new one only if there isn't a usable one cached.
 * @param invalidTicket A ticket the caller just saw rejected. Forces a refetch if it's still the cached one.
 */
export async function getApiTicket(
  account: string,
  password: string,
  invalidTicket?: string
): Promise<ApiTicketResponse> {
  const key = credentialKey(account, password);

  const pending = inFlight.get(key);
  if (pending !== undefined) return pending;

  const cached = cache.get(key);
  if (
    cached !== undefined &&
    cached.ticket !== invalidTicket &&
    Date.now() - cached.issuedAt < ticketLifetime
  )
    return cached;

  const request = fetchTicket(key, account, password);
  inFlight.set(key, request);

  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}

/** Registers the `get-api-ticket` IPC handler. Main process only. */
export function registerApiTicketProvider(): void {
  electron.ipcMain.handle(
    'get-api-ticket',
    async (
      _e: electron.IpcMainInvokeEvent,
      account: string,
      password: string,
      invalidTicket?: string
    ) => getApiTicket(account, password, invalidTicket)
  );
}

/** Requests the shared API ticket from the main process. Renderer only.
 * Throws on network failure like Axios would, so callers can still tell it apart from F-List rejecting the login
 */
export async function requestApiTicket(
  account: string,
  password: string,
  invalidTicket?: string
): Promise<ApiTicketResponse> {
  const res = <ApiTicketResponse>(
    await electron.ipcRenderer.invoke(
      'get-api-ticket',
      account,
      password,
      invalidTicket
    )
  );

  if (res.request) {
    const error = new Error(res.error);
    (<Error & { request: true }>error).request = true;
    throw error;
  }

  return res;
}

/** Creates a `Connection` ticket provider backed by the shared ticket. Renderer only*/
export function sharedTicketProvider(
  account: string,
  password: string
): (invalidTicket?: string) => Promise<string> {
  return async invalidTicket => {
    const res = await requestApiTicket(account, password, invalidTicket);
    if (res.error !== '') throw new Error(res.error);
    return res.ticket;
  };
}

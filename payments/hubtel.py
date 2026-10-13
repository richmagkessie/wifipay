import requests
import base64
from django.conf import settings


def _auth_header():
    token = base64.b64encode(
        f'{settings.HUBTEL_CLIENT_ID}:{settings.HUBTEL_CLIENT_SECRET}'.encode()
    ).decode()
    return {'Authorization': f'Basic {token}', 'Content-Type': 'application/json'}


def initiate_payment(phone, amount, description, callback_url, client_reference):
    payload = {
        'amount':           float(amount),
        'description':      description,
        'primaryCallbackUrl': callback_url,
        'clientReference':  client_reference,
        'customerPhoneNumber': phone,
        'customerMsisdn':   phone,
    }
    r = requests.post(
        f'{settings.HUBTEL_BASE_URL}/v2/payments/initiate',
        json=payload,
        headers=_auth_header(),
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def check_payment_status(client_reference):
    r = requests.get(
        f'{settings.HUBTEL_BASE_URL}/v2/payments/{client_reference}/status',
        headers=_auth_header(),
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def disburse_to_momo(phone, amount, reference, description):
    """Send money from WifiPay merchant account to an ISP's MoMo number."""
    payload = {
        'recipientMsisdn':  phone,
        'amount':           float(amount),
        'description':      description,
        'clientReference':  reference,
    }
    r = requests.post(
        f'{settings.HUBTEL_BASE_URL}/v2/disbursements',
        json=payload,
        headers=_auth_header(),
        timeout=30,
    )
    r.raise_for_status()
    return r.json()

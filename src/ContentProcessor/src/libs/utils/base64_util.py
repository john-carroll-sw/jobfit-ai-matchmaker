import base64


def is_base64_encoded(data: str) -> bool:
    try:
        # Try to decode the string
        decoded_data = base64.b64decode(data, validate=True)
        # Check if the decoded data can be encoded back to the original string
        if base64.b64encode(decoded_data).decode("utf-8") == data:
            return True
        return False
    except Exception:
        return False

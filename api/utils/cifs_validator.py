"""CIFS Samba dataset validator with fuzzy path suggestion capabilities."""

import os
from typing import Any, Dict, List, Optional
from loguru import logger
import smbclient

DEFAULT_CONTROL_HOST = os.getenv("CONTROL_HOST", "127.0.0.1")
DEFAULT_CIFS_USER = os.getenv("CIFS_USER", "")
DEFAULT_CIFS_PASS = os.getenv("CIFS_PASS", "")
DEFAULT_CIFS_PORT = int(os.getenv("CIFS_PORT", "23449"))

_session_initialized: bool = False


def _init_smb_session() -> None:
    """Initialize client configuration and register session for Samba connection."""
    global _session_initialized
    if not _session_initialized:
        try:
            smbclient.ClientConfig().set(
                username=DEFAULT_CIFS_USER,
                password=DEFAULT_CIFS_PASS,
                require_secure_negotiate=False,
            )
            smbclient.register_session(
                DEFAULT_CONTROL_HOST,
                username=DEFAULT_CIFS_USER,
                password=DEFAULT_CIFS_PASS,
                port=DEFAULT_CIFS_PORT,
                require_signing=False,
                encrypt=False,
            )
            _session_initialized = True
        except Exception as exc:
            logger.warning(f"Could not register persistent SMB session: {exc}")


def convert_dataset_path_to_unc(dataset_path: str, host: str = DEFAULT_CONTROL_HOST) -> str:
    r"""Convert POSIX dataset path into Windows UNC path for Samba access.

    Args:
        dataset_path: POSIX path (e.g. /datasets/AREPO/data.yaml).
        host: Host IP or hostname.

    Returns:
        str: Formatted UNC path (e.g. \\192.168.10.252\datasets\AREPO\data.yaml).
    """
    clean = dataset_path.strip().replace("/", "\\")
    if clean.startswith("\\datasets\\"):
        return f"\\\\{host}{clean}"
    if clean.startswith("datasets\\"):
        return f"\\\\{host}\\{clean}"
    return f"\\\\{host}\\datasets\\{clean.lstrip(chr(92))}"


def find_similar_dataset_suggestions(
    dataset_path: str,
    host: str = DEFAULT_CONTROL_HOST,
    port: int = DEFAULT_CIFS_PORT,
) -> List[str]:
    """Inspect project directories to find similar existing dataset YAML descriptors.

    Args:
        dataset_path: Failed dataset path.
        host: Samba server host.
        port: Samba server port.

    Returns:
        List[str]: Suggested existing valid dataset paths.
    """
    suggestions: List[str] = []
    parts = [p for p in dataset_path.strip().split("/") if p and p != "datasets"]
    if not parts:
        return suggestions

    project = parts[0]
    project_unc = f"\\\\{host}\\datasets\\{project}"
    target_names = [p for p in parts[1:] if not p.endswith((".yaml", ".yml"))]
    target_needle = target_names[-1] if target_names else project

    try:
        entries = smbclient.listdir(project_unc, port=port)
        for entry in entries:
            entry_clean = entry.strip("\\/")
            if target_needle.lower() in entry_clean.lower() or any(
                chunk.lower() in entry_clean.lower() for chunk in target_needle.split("_") if len(chunk) > 2
            ):
                candidate_posix = f"/datasets/{project}/{entry_clean}/data.yaml"
                candidate_unc = convert_dataset_path_to_unc(candidate_posix, host=host)
                try:
                    smbclient.stat(candidate_unc, port=port)
                    suggestions.append(candidate_posix)
                except Exception:
                    continue
    except Exception as exc:
        logger.debug(f"Unable to scan project directory for suggestions: {exc}")

    return suggestions


def validate_dataset_cifs(
    dataset_path: str,
    host: str = DEFAULT_CONTROL_HOST,
    port: int = DEFAULT_CIFS_PORT,
) -> Dict[str, Any]:
    """Validate physical presence of a dataset descriptor on the CIFS share.

    Args:
        dataset_path: Absolute path to the dataset YAML descriptor.
        host: Host IP or hostname.
        port: Host CIFS port.

    Returns:
        Dict[str, Any]: Validation payload including validity flag, size, and suggestions.
    """
    _init_smb_session()
    unc_path = convert_dataset_path_to_unc(dataset_path, host=host)

    try:
        stat_info = smbclient.stat(unc_path, port=port)
        return {
            "valid": True,
            "path": dataset_path,
            "size_bytes": stat_info.st_size,
            "error": None,
            "suggestions": [],
        }
    except Exception as exc:
        err_msg = str(exc)
        suggestions = find_similar_dataset_suggestions(dataset_path, host=host, port=port)
        return {
            "valid": False,
            "path": dataset_path,
            "size_bytes": None,
            "error": f"Path '{dataset_path}' not found on shared storage ({err_msg}).",
            "suggestions": suggestions,
        }

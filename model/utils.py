#
# Project Ginger S390x
#
# Copyright IBM, Corp. 2015
#
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA

import ConfigParser
import glob
import re
import os

from wok.exception import OperationFailed, InvalidParameter
from os import listdir
from wok.utils import run_command, wok_log

res_hash = {}
adapters = []
ports = []

adapter_dir = '/sys/bus/ccw/drivers/zfcp/'
wlun = "0xc101000000000000"
lun0 = "0x0000000000000000"
sg_dir = "/sys/class/scsi_generic/"
udevadm = "/sbin/udevadm"


def _get_lun_dict():
    """
    Get the dictionary of LUNs configured on the system.
    :return: Dictionary containing discovered LUNs and their attributes
    """
    lun_dict = {}

    # Get the list of sg devices of configured LUNs (FC)
    sg_devices = get_sg_devices()

    # Iterate over all FC sg devices
    for sg_dev in sg_devices:
        wwpn = open(sg_dir + "/" + sg_dev + "/device/wwpn").readline().rstrip()
        fcp_lun = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/fcp_lun").readline().rstrip()
        hba_id = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/hba_id").readline().rstrip()

        if hba_id not in lun_dict:
            lun_dict[hba_id] = {}

        wwpn_lun_dict = {wwpn: {}}
        if wwpn not in lun_dict[hba_id]:
            lun_dict[hba_id].update(wwpn_lun_dict)

        fcp_lun_dict = {fcp_lun: sg_dev}

        # Lets see what other LUNs we can disocover using LUN 0
        if fcp_lun == lun0 or fcp_lun == wlun:
            out, err, rc = run_command(['sg_luns', '/dev/' + sg_dev])
            if rc == 0:
                luns = parse_sg_luns(out)
                for lun in luns:
                    if lun == fcp_lun:
                        continue
                    fcp_lun_dict.update({lun: None})
            else:
                wok_log.error(
                    "Error getting sg_luns for sg device. %s", sg_dev)
                # Not raising any exception here. The code should
                # continue to work for other LUNs even if it fails for
                # this LUN. That way we could grab as much info as
                # possible from system.

        if fcp_lun not in lun_dict[hba_id][wwpn]:
            lun_dict[hba_id][wwpn].update(fcp_lun_dict)

    # Dumping the LUNs info in logs. This could be very helpful
    # in dealing with issues where we won't have access to live system
    wok_log.info("Available LUNs on the system, %s", lun_dict)
    return lun_dict


def _get_sg_inq_dict(sg_inq_output):
    """
    Parse the output of 'sg_inq' command against the the relavant sg_device
    :param sg_inq_output: Output of the command 'sg_inq' on sg_devic3
    :return: Dictinary of parsed 'sg_inq' output
    """

    sg_inq_dict = {}

    if not sg_inq_output:
        sg_inq_dict['status'] = 'offline'
    else:
        sg_inq_dict['status'] = 'online'

    try:
        pattern = r'Peripheral device type:\s+(\S+)'
        m = re.search(pattern, sg_inq_output)
        sg_inq_dict['type'] = m.group(1)

        pattern = r'Vendor identification:\s+(\S+)'
        m = re.search(pattern, sg_inq_output)
        sg_inq_dict['vendor'] = m.group(1)

        pattern = r'Product identification:\s+(\S+)'
        m = re.search(pattern, sg_inq_output)
        sg_inq_dict['product'] = m.group(1)

        pattern = r'Unit serial number:\s+(\S+)'
        m = re.search(pattern, sg_inq_output)
        sg_inq_dict['controllerSN'] = m.group(1)
    except:
        wok_log.error("Error parsing sg_luns for sg device. %s", sg_dev)
        # Not raising any exception here. The code should
        # continue to work for other LUNs even if it fails for
        # this LUN. That way we could grab as much info as
        # possible from system.

    return sg_inq_dict


def remove_lun(adapter, port, lun_id):
    """
    Remove a LUN from system
    :param adapter: HBA adapter id
    :param port: Remote port wwpn
    :param lun_id: Id of the given LUN
    """

    port_dir = '/sys/bus/ccw/drivers/zfcp/' + adapter + '/' + port + '/'
    lun_dir = port_dir + lun_id

    wok_log.info("Removing LUN, %s", lun_dir)

    # Let's look for the sg_device associated with this LUN
    sg_device = ''
    sg_devices = get_sg_devices()
    for sg_dev in sg_devices:
        wwpn = open(sg_dir + "/" + sg_dev + "/device/wwpn").readline().rstrip()
        fcp_lun = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/fcp_lun").readline().rstrip()
        hba_id = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/hba_id").readline().rstrip()

        if hba_id == adapter and wwpn == port and fcp_lun == lun_id:
            sg_device = sg_dev

            break

    if not os.path.exists(lun_dir):
        return
    else:
        # If there is any sg_device, remove it
        # If there is no sg_device, then the LUN was only discovered
        # and not configured, so we don't have to do anything
        if sg_device:
            try:
                with open(sg_dir + sg_device + '/device/delete', "w")\
                        as txt_file:
                    txt_file.write("1")
            except Exception as e:
                wok_log.error("Unable to remove sg_dev, %s", sg_device)
                raise OperationFailed("GS390XSTG00001", {'err': e.message})

            try:
                with open(port_dir + 'unit_remove', "w") as txt_file:
                    txt_file.write(lun_id)
            except Exception as e:
                wok_log.error("Unable to remove LUN, %s", lun_dir)
                raise OperationFailed("GS390XSTG00002", {'err': e.message})


def add_lun(adapter, port, lun_id):
    """
    Add a LUN to system
    :param adapter: HBA adapter id
    :param port: Remote port wwpn
    :param lun_id: Id of the given LUN
    """

    port_dir = '/sys/bus/ccw/drivers/zfcp/' + adapter + '/' + port + '/'
    lun_dir = port_dir + lun_id

    wok_log.info("Adding LUN, %s", lun_dir)

    if os.path.exists(lun_dir):
        # LUN already present on the system, nothing to add.
        return
    else:
        try:
            with open(port_dir + 'unit_add', "w") as txt_file:
                txt_file.write(lun_id)

            for _ in range(4):
                # Don't wait for udev queue to completely flush.
                # Wait for the relavant entry for this LUN is created in sysfs
                run_command([udevadm, "settle", "--exit-if-exists=" + lun_dir])
                if os.path.exists(lun_dir):
                    break
        except Exception as e:
            wok_log.error("Unable to add LUN, %s", lun_dir)
            raise OperationFailed("GS390XSTG00003", {'err': e.message})


def get_lun_info(adapter, port, lun_id):
    """
    Get detailed information about a specific LUN
    :param adapter: HBA adapter id
    :param port: Remote port wwpn
    :param lun_id: Id of the given LUN
    :return: Dictionary containing detailed information about a specific LUN
    """

    port_dir = '/sys/bus/ccw/drivers/zfcp/' + adapter + '/' + port + '/'
    lun_dir = port_dir + lun_id

    lun_info = {}

    if os.path.exists(lun_dir):
        lun_info['configured'] = True
    else:
        lun_info['configured'] = False

        try:
            with open(port_dir + 'unit_add', "w") as txt_file:
                txt_file.write(lun_id)

            for _ in range(4):
                run_command([udevadm, "settle", "--exit-if-exists=" + lun_dir])
                if os.path.exists(lun_dir):
                    break

            if not os.path.exists(lun_dir):
                with open(port_dir + 'unit_remove', "w") as txt_file:
                    txt_file.write(lun0)

                with open(port_dir + 'unit_add', "w") as txt_file:
                    txt_file.write(wlun)

                for _ in range(4):
                    run_command(
                        [udevadm, "settle", "--exit-if-exists=" + lun_dir])

                    if os.path.exists(lun_dir):
                        break

                    if not os.path.exists(lun_dir):
                        with open(port_dir + 'unit_remove', "w") as txt_file:
                            txt_file.write(wlun)

        except Exception as e:
            wok_log.error("Unable to add LUN temporarily, %s", lun_dir)
            raise OperationFailed("GS390XSTG00003", {'err': e.message})

    # Get the list of FC only sg devices. This includes the sg_devices
    # of temporary LUNs as well.
    sg_devices = get_sg_devices()
    for sg_dev in sg_devices:
        wwpn = open(sg_dir + "/" + sg_dev + "/device/wwpn").readline().rstrip()
        fcp_lun = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/fcp_lun").readline().rstrip()
        hba_id = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/hba_id").readline().rstrip()

        if hba_id == adapter and wwpn == port and fcp_lun == lun_id:
            lun_info['hbaId'] = hba_id
            lun_info['remoteWwpn'] = port
            lun_info['lunId'] = lun_id

            lun_info['sgDev'] = sg_dev
            out, err, rc = run_command(["sg_inq", "/dev/" + sg_dev])
            if rc == 0:
                lun_info.update(_get_sg_inq_dict(out))
            break

    # Get rid of the LUN if it's not configured
    if not lun_info['configured']:
        try:
            wok_log.info("Removing sg_device , %s", lun_info['sgDev'])
            with open(sg_dir + lun_info['sgDev'] + '/device/delete', "w")\
                    as txt_file:
                txt_file.write("1")

            del lun_info['sgDev']

        except Exception as e:
            wok_log.error("Unable to remove sg_device , %s", lun_info['sgDev'])
            raise OperationFailed("GS390XSTG00001", {'err': e.message})

        try:
            wok_log.info("Removing LUN , %s", lun_dir)
            with open(port_dir + 'unit_remove', "w") as txt_file:
                txt_file.write(fcp_lun)
        except:
            # If failed to remove the given LUN, at least remove the wlun
            wok_log.info("Removing LUN , %s", port_dir + ":" + wlun)
            try:
                with open(port_dir + 'unit_remove', "w") as txt_file:
                    txt_file.write(wlun)
            except:
                # Just logging is sufficient. No need to raise exception and
                # stop the code flow
                wok_log.error(
                    "Removing LUN failed , %s",
                    port_dir + ":" + wlun)

    return lun_info


def get_sg_devices():
    """
    Returns the list of FC only 'sg' devices.
    :return List of FC only sg_devices
    """

    sg_devices = []
    for sg_dev in listdir(sg_dir):

        # skip devices whose transport is not FC
        if os.path.exists(sg_dir + "/" + sg_dev + "/device/wwpn"):
            sg_devices.append(sg_dev)

    return sg_devices


def get_sg_dev(adapter, port, lun_id):
    """
    Find the corresponding sg_device for the given LUN
    :param adapter:
    :param port:
    :param lun_id:
    :return:
    """
    sg_device = ''

    sg_devices = get_sg_devices()
    for sg_dev in sg_devices:
        wwpn = open(sg_dir + "/" + sg_dev + "/device/wwpn").readline().rstrip()
        fcp_lun = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/fcp_lun").readline().rstrip()
        hba_id = open(
            sg_dir +
            "/" +
            sg_dev +
            "/device/hba_id").readline().rstrip()

        if hba_id == adapter and wwpn == port and fcp_lun == lun_id:
            sg_device = sg_dev
            break

    return sg_device


def _get_host_fcp_dict():
    """
    Get the dictionary containing the host HBAs and
    corresponding remote ports
    :return: HBA -> LUNs dictionary
    """
    host_fcp_dict = {}

    adapters = glob.glob(adapter_dir + '*.*.*')

    for adapter in adapters:
        a = adapter.split('/')[-1]
        host_fcp_dict[a] = []

        ports = glob.glob(adapter + '/0x*')

        for port in ports:
            b = port.split('/')[-1]
            host_fcp_dict[a].append(b)

    return host_fcp_dict


def get_luns():
    """
    Get the list of all the LUNs including unconfigured ones
    :return: List of all the LUN paths
    """
    host_fcp_dict = _get_host_fcp_dict()
    global lun_dict
    lun_dict = _get_lun_dict()
    luns = []

    # Loop over all HBA adapters
    for adapter in host_fcp_dict:
        # Loop over every remote port for the given HBA adapter
        for port in host_fcp_dict[adapter]:
            temp_luns = {}
            port_dir = adapter_dir + adapter + '/' + port + '/'

            # If port went offline or is not accessible, skip.
            if not os.path.exists(port_dir):
                continue

            access_denied = open(
                port_dir + 'access_denied').readline().rstrip()
            if access_denied == "1":
                continue

            failed = open(port_dir + 'failed').readline().rstrip()
            if failed == "1":
                continue

            in_recovery = open(port_dir + 'in_recovery').readline().rstrip()
            if in_recovery == "1":
                continue

            # If no LUNs are associated with this port, try adding LUN 0
            # to initiate LUN discovery on this port later
            if adapter not in lun_dict or port not in lun_dict[adapter]:
                try:
                    with open(port_dir + 'unit_add', "w") as txt_file:
                        txt_file.write(lun0)

                    for _ in range(4):
                        run_command(
                            [udevadm, "settle",
                             "--exit-if-exists=" + port_dir + lun0])
                        lun_dict = _get_lun_dict()
                        if port in lun_dict[adapter]:
                            temp_luns[lun0] = True
                            break

                except Exception as e:
                    wok_log.error("Unable to add LUN 0 , %s", port_dir + lun0)

                if adapter not in lun_dict or port not in lun_dict[adapter]:
                    try:
                        with open(port_dir + 'unit_remove', "w") as txt_file:
                            txt_file.write(lun0)
                        temp_luns[lun0] = False

                    except Exception as e:
                        wok_log.error(
                            "Unable to remove LUN 0 , %s", port_dir + lun0)

                    try:
                        with open(port_dir + 'unit_add', "w") as txt_file:
                            txt_file.write(wlun)

                        for _ in range(4):
                            run_command(
                                [udevadm, "settle",
                                 "--exit-if-exists=" + port_dir + "/" + wlun])
                            lun_dict = _get_lun_dict()
                            if port in lun_dict[adapter]:
                                temp_luns[wlun] = True
                                break

                    except Exception as e:
                        wok_log.error(
                            "Unable to add wlun , %s", port_dir + wlun)

                    if adapter not in lun_dict or port not in lun_dict[
                            adapter]:
                        try:
                            with open(port_dir + 'unit_remove', "w")\
                                    as txt_file:
                                txt_file.write(wlun)
                            temp_luns[wlun] = False
                            continue

                        except Exception as e:
                            wok_log.error(
                                "Unable to remove wlun , %s", port_dir + wlun)

            for lun in lun_dict[adapter][port]:

                lun_dict = _get_lun_dict()
                luns.append(adapter + ":" + port + ":" + lun)

                # Get rid of the LUN if added temporarily for discovery
                if lun in temp_luns and temp_luns[lun] is True:
                    sg_dev = ''
                    if port in lun_dict[
                            adapter] and lun in lun_dict[adapter][port]:
                        sg_dev = lun_dict[adapter][port][lun]

                    if sg_dev:
                        try:
                            wok_log.info("Removing sg_device , %s", sg_dev)
                            with open(sg_dir + sg_dev + '/device/delete', "w")\
                                    as txt_file:
                                txt_file.write("1")

                        except Exception as e:
                            wok_log.error(
                                "Unable to remove sg_device , %s", sg_dev)
                            raise OperationFailed(
                                "GS390XSTG00001", {'err': e.message})

                        try:
                            wok_log.info("Removing LUN 0, %s", port_dir)
                            with open(port_dir + 'unit_remove', "w")\
                                    as txt_file:
                                txt_file.write(lun0)
                        except:
                            wok_log.error(
                                "unable to remove LUN 0, %s", port_dir)
                            wok_log.info("Removing wlun,  %s", wlun)
                            try:
                                with open(port_dir + 'unit_remove', "w")\
                                        as txt_file:
                                    txt_file.write(wlun)
                            except:
                                # Can be safely ingored, so not raising
                                # exception
                                wok_log.error(
                                    "unable to remove wlun, %s", port_dir)

                    temp_luns[lun] = False

    return luns


def parse_sg_luns(sg_luns_output):
    """
    Parse the output of 'sg_luns' command on the given sg_device
    :param sg_luns_output: Output of sg_luns command
    return: Dictionary containing parsed output
    """

    # Take out LUN IDs of all discovered LUNs
    pattern = re.compile(r'(\d{16})')
    match = pattern.findall(sg_luns_output)
    match = ['0x' + i for i in match]
    # By default returns empty list if no match found

    return match


def validate_lun_path(lun_path):
    """
    Validate the LUN path and return the list of LUN path components
    :param lun_path: Path to access the LUN
    :return : List containing the LUN path components
    """

    lun_path_list = []
    try:
        lun_path_list = lun_path.split(":")
    except Exception as e:
        wok_log.error("Unable to parse lun path components, %s", lun_path)
        raise InvalidParameter("GS390XSTG00004", {'err': e.message})

    validate_hba_id(lun_path_list[0])
    validate_wwpn_or_lun(lun_path_list[1])
    validate_wwpn_or_lun(lun_path_list[2])

    return lun_path_list


def validate_hba_id(hba_id):
    """
    Validate hba id which should be of form, 0.0.xxxx
    :param hba_id: HBA ID to be validated
    """
    pattern = re.compile(r'0.0.\d{4}')
    valid = pattern.match(hba_id)
    if not valid:
        wok_log.error("Unable to validate HBA ID, %s", hba_id)
        raise InvalidParameter("GS390XSTG00005", {'err': 'Invalid HBA ID'})


def validate_wwpn_or_lun(input_id):
    """
    Validate wwpn or lun_id which should be of form, 0xaaaaaaaaaaaaaaaa.
    :param input_id: input_id to be validated
    """
    pattern = re.compile(r'0x[a-zA-Z0-9]{16}')
    valid = pattern.match(input_id)
    if not valid:
        wok_log.error("Unable to validate, %s", input_id)
        raise InvalidParameter(
            "GS390XSTG00006", {
                'err': 'Invalide wwpn or LUN ID'})


def is_lun_scan_enabled():
    """
    Detect if automatic LUN scanning is enabled or disabled
    :return : True if enabled, False otherwise
    """
    try:
        config = ConfigParser.ConfigParser()
        config.read("/etc/zipl.conf")
        default_boot = config.get('defaultboot', 'default')
        boot_parameters = config.get(default_boot, 'parameters')

        pattern = r'.+zfcp\.allow_lun_scan=(\d)'

        m = re.search(pattern, boot_parameters)
        enabled = bool(int(m.group(1)))
        return enabled

    except Exception as e:
        wok_log.error("Unable to parse /etc/zipl.conf")
        raise OperationFailed("GS390XSTG00013", {'err': e.message})

# Basic Pool iAppLX

This iApp is an example of accessing iCRD, including an audit processor.  The iApp itself is very simple - it manages the members of a pool.

The audit processor wakes up every 30 seconds (configurable). If the pool has changed on the BigIP then the block is rebound, restoring the Big-IP to the previous configuration.

This iApp also demostrates usage of identified requests with custom HTTPS port when user specifies remote BIG-IP address and device-group name when configuring. In this configuration, Device trust with remote BIG-IP address should be established ahead of time before deploying iApp.

## Build (requires rpmbuild)

    $ npm run build

Build output is an RPM package
## Using IAppLX from BIG-IP UI
If you are using BIG-IP, install f5-iappslx-basic-pool RPM package using iApps->Package Management LX->Import screen. To create an application, use iApps-> Templates LX -> Application Services -> Applications LX -> Create screen. Default IApp LX UI will be rendered based on the input properties specified in basic pool IAppLX.

Pool name is mandatory when creating or updating iAppLX configuration. Optionally you can add any number of pool members.

## Using IAppLX from Container to configure BIG-IP [coming soon]

Run the REST container [TBD] with f5-iappslx-basic-pool IAppLX package. Pass in the remote BIG-IP to be trusted when starting REST container as environment variable.

Create an Application LX block with hostname, deviceGroupName, poolName, poolType and poolMembers as shown below.
Save the JSON to block.json and use it in the curl call

```json
{
  "name": "msda-etcd",
  "inputProperties": [
    {
      "id": "etcdEndpoint",
      "type": "STRING",
      "value": "http://1.1.1.1:2379, http://1.1.1.2:2379",
      "metaData": {
        "description": "Etcd endpoint list",
        "displayName": "etcd endpoints",
        "isRequired": true
      }
    },
    {
      "id": "poolName",
      "type": "STRING",
      "value": "/Common/samplePool",
      "metaData": {
        "description": "Pool Name to be created",
        "displayName": "BIG-IP Pool Name",
        "isRequired": true
      }
    },
    {
      "id": "poolType",
      "type": "STRING",
      "value": "round-robin",
      "metaData": {
        "description": "load-balancing-mode",
        "displayName": "Load Balancing Mode",
        "isRequired": false,
        "uiType": "dropdown",
        "uiHints": {
          "list": {
            "dataList": [
              "round-robin",
              "least-connections-member",
              "least-connections-node"
            ]
          }
        }
      }
    },
    {
      "id": "healthMonitor",
      "type": "STRING",
      "value": "tcp",
      "metaData": {
        "description": "Health Monitor",
        "displayName": "Health Monitor",
        "isRequired": false,
        "uiType": "dropdown",
        "uiHints": {
          "list": {
            "dataList": [
              "tcp",
              "udp",
              "http"
            ]
          }
        }
      }
    },
    {
      "id": "serviceName",
      "type": "STRING",
      "value": "http",
      "metaData": {
        "description": "Service name to be exposed",
        "displayName": "Service Name in etcd",
        "isRequired": false
      }
    }
  ],
  "dataProperties": [
    {
      "id": "pollInterval",
      "type": "NUMBER",
      "value": 30,
      "metaData": {
        "description": "Interval of polling from BIG-IP to etcd",
        "displayName": "Polling Invertal",
        "isRequired": false
      }
    }
  ],
  "configurationProcessorReference": {
    "link": "https://localhost/mgmt/shared/iapp/processors/msda-etcdConfig"
  },
  "audit": {
    "intervalSeconds": 0,
    "policy": "NOTIFY_ONLY"
  },
  "sourcePackage": {
    "packageName": "f5-iapplx-msda-etcd-0.0.1-0001.noarch"
  },
  "configProcessorTimeoutSeconds": 30,
  "statsProcessorTimeoutSeconds": 15,
  "configProcessorAffinity": {
    "processorPolicy": "LOAD_BALANCED",
    "affinityProcessorReference": {
      "link": "https://localhost/mgmt/shared/iapp/processors/affinity/load-balanced"
    }
  },
  "state": "TEMPLATE"
}
```

Post the block REST container using curl. Note you need to be running REST container for this step
and it needs to listening at port 8433
```bash
curl -sk -X POST -d @block.json https://localhost:8443/mgmt/shared/iapp/blocks
```

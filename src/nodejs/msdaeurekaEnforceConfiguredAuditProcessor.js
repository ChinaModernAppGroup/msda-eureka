/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.

  Updated by Ping Xiong on May/15/2022

*/

'use strict';


var q = require("q");

var blockUtil = require("./blockUtils");
var logger = require("f5-logger").getInstance();
//var fs = require('fs');

// Setup a signal for onpolling status. It has an initial state "false".
//const msdaeurekaOnPollingSignal = '/var/tmp/msdaeurekaOnPolling';
//var msdaOnPolling = false;


function msdaeurekaEnforceConfiguredAuditProcessor() {
    // you can also use this.logger on a RestWorker
    // Using directly from require (below) is another way to call log events
    logger.info("loading msdaeureka Enforce Configured Audit Processor");
}

// For logging, show the number of the audit cycle. Increments on each new "turn" of the auditor
var entryCounter = 0;

var getLogHeader = function () {
    return "AUDIT #" + entryCounter + ": ";
};


msdaeurekaEnforceConfiguredAuditProcessor.prototype.WORKER_URI_PATH = "shared/iapp/processors/msdaeurekaEnforceConfiguredAudit";

msdaeurekaEnforceConfiguredAuditProcessor.prototype.onStart = function (success) {
    logger.fine("msdaeurekaEnforceConfiguredAuditProcessor.prototype.onStart");
    //logger.fine("MSDA eureka audit onStart: ConfigProcessor polling state: ");
    this.apiStatus = this.API_STATUS.INTERNAL_ONLY;
    this.isPublic = true;
 
/*
    icr.initialize( {
        restOperationFactory: this.restOperationFactory,
        restHelper: this.restHelper,
        wellKnownPorts: this.wellKnownPorts,
        referrer: this.referrer,
        restRequestSender: this.restRequestSender
    });
*/
    success();
};


// The incoming restOperation contains the current Block.
// Populate auditTaskState.currentInputProperties with the values on the device.
// In ENFORCE_CONFIGURED, ignore the found configuration is on the BigIP.
msdaeurekaEnforceConfiguredAuditProcessor.prototype.onPost = function (restOperation) {
    entryCounter++;
    logger.fine(getLogHeader() + "MSDA Audit onPost: START");
    var oThis = this;
    var auditTaskState = restOperation.getBody();

    setTimeout(function () {
        try {
            if (!auditTaskState) {
                throw new Error("AUDIT: Audit task state must exist ");
            }
            /*
                logger.fine(getLogHeader() + "Incoming properties: " +
                    this.restHelper.jsonPrinter(auditTaskState.currentInputProperties));
                */

            var blockInputProperties = blockUtil.getMapFromPropertiesAndValidate(
                auditTaskState.currentInputProperties,
                [
                //  "eurekaEndpoint",
                //  "authenticationCert",
                //  "nameSpace",
                //  "serviceName",
                "poolName",
                "poolType",
                "healthMonitor",
                ]
            );

            // Check the polling state, trigger ConfigProcessor if needed.
            // Move the signal checking here
            logger.fine("MSDA eureka Audit: msdaeurekaOnpolling: ", global.msdaeurekaOnPolling);
            logger.fine("MSDA eureka Audit: msdaeureka poolName: ", blockInputProperties.poolName.value);

            if (
                global.msdaeurekaOnPolling.includes(blockInputProperties.poolName.value)
            ) {
                logger.fine(
                "MSDA eureka audit onPost: ConfigProcessor is on polling state, no need to fire an onPost."
                );
            } else {
                logger.fine(
                "MSDA eureka audit onPost: ConfigProcessor is NOT on polling state, will trigger ConfigProcessor onPost."
                );
                try {
                var poolNameObject = getObjectByID(
                    "poolName",
                    auditTaskState.currentInputProperties
                );
                poolNameObject.value = null;
                oThis.finishOperation(restOperation, auditTaskState);
                logger.fine(
                    "MSDA eureka audit onPost: trigger ConfigProcessor onPost "
                );
                } catch (err) {
                logger.fine(
                    "MSDA eureka audit onPost: Failed to send out restOperation. ",
                    err.message
                );
                }
            }
        } catch (ex) {
            logger.fine("msdaeurekaEnforceConfiguredAuditProcessor.prototype.onPost caught generic exception " + ex);
            restOperation.fail(ex);
        }
    }, 1000)
};

var getObjectByID = function ( key, array) {
    var foundItArray = array.filter( function( item ) {
        return item.id === key;
    });
    return foundItArray[0];
};

msdaeurekaEnforceConfiguredAuditProcessor.prototype.finishOperation = function( restOperation, auditTaskState ) {
    restOperation.setBody(auditTaskState);
    this.completeRestOperation(restOperation);
    logger.fine(getLogHeader() + "DONE" );
};

module.exports = msdaeurekaEnforceConfiguredAuditProcessor;

# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Adapter-Specific Context

### TVSpielfilm Adapter
- **Adapter Name**: tvspielfilm
- **Primary Function**: TV program guide from RSS feeds provided by tvspielfilm.de
- **Key Features**: 
  - Fetches current TV programs ("jetzt")
  - Daily program highlights at 20:15 and 22:00
  - Movie highlights of the day
  - Search functionality with configurable search terms
  - Provides both processed and raw RSS data
- **Dependencies**: 
  - `xml2js` for RSS/XML parsing
  - `request` for HTTP calls (deprecated, consider replacing with axios or fetch)
- **Schedule Mode**: Runs every 5 minutes (`*/5 * * * *`) to fetch updated TV program data
- **Data Sources**: RSS feeds from tvspielfilm.de (German TV program provider)
- **State Structure**:
  - `json.jetzt` - Currently airing programs
  - `json.heute2015` - Programs at 20:15
  - `json.heute2200` - Programs at 22:00  
  - `json.filme` - Movie highlights
  - `json.tipps` - TV recommendations (discontinued by provider)
  - `json.raw.*` - Raw RSS data for each category
  - `search.list` - Configurable search terms
  - `search.alert` - Boolean indicator when search terms are found

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Check for created states
                        const states = await harness.objects.getObjectListAsync({
                            startkey: harness.adapterName + '.0',
                            endkey: harness.adapterName + '.0.\u9999'
                        });
                        
                        console.log(`📊 Found ${states.rows.length} objects created by adapter`);
                        
                        // Example assertions
                        const stateExists = states.rows.some(row => 
                            row.id.includes('currently') || 
                            row.id.includes('hourly') || 
                            row.id.includes('daily')
                        );
                        
                        if (!stateExists) {
                            return reject(new Error('Expected weather states not found'));
                        }

                        console.log('✅ Step 4: Test completed successfully');
                        resolve();
                        
                    } catch (error) {
                        console.error('❌ Test failed:', error);
                        reject(error);
                    }
                });
            });
        });
    }
});
```

#### Test Execution Best Practices
1. **Start with pre-configuration**: Always set adapter config before starting
2. **Use promisified patterns**: Wrap callback-based operations in Promises
3. **Wait for completion**: Give adequate time for async operations
4. **Check meaningful states**: Verify expected objects/states are created
5. **Handle errors gracefully**: Provide clear failure messages with troubleshooting hints

### State Object Management
When working with ioBroker states, use proper patterns:

```javascript
// ✅ Good: Use adapter methods for state operations
this.setObjectNotExists('info.connection', {
    type: 'state',
    common: {
        name: 'connected',
        type: 'boolean',
        role: 'indicator.connected',
        read: true,
        write: false
    },
    native: {}
});

// ✅ Good: Set state values properly
this.setState('info.connection', true, true);

// ❌ Avoid: Direct database operations unless absolutely necessary
```

## Logging Best Practices

### Log Levels (Use Appropriately)
- `this.log.error()`: Critical errors that prevent normal operation
- `this.log.warn()`: Warning conditions that should be addressed
- `this.log.info()`: General information about adapter operation
- `this.log.debug()`: Detailed debugging information for development

### Log Message Guidelines
```javascript
// ✅ Good: Structured, informative logging
this.log.info(`Connected to ${serviceName} API, ${deviceCount} devices found`);
this.log.debug(`Processing device ${deviceId} with status ${status}`);
this.log.error(`Failed to connect to API: ${error.message}`);

// ❌ Avoid: Vague or excessive logging
this.log.info('Starting...'); // Too vague
this.log.debug('Data:', JSON.stringify(largeObject)); // Too verbose
```

## State Management

### State Creation Best Practices
```javascript
// ✅ Preferred: Use setObjectNotExists for state creation
await this.setObjectNotExistsAsync('device.temperature', {
    type: 'state',
    common: {
        name: 'Temperature',
        type: 'number',
        role: 'value.temperature',
        unit: '°C',
        read: true,
        write: false
    },
    native: {}
});

// Set the value after object creation
await this.setStateAsync('device.temperature', value, true);
```

### State Updates
```javascript
// ✅ Good: Check for actual changes before updating
const currentState = await this.getStateAsync('device.status');
if (!currentState || currentState.val !== newValue) {
    await this.setStateAsync('device.status', newValue, true);
}

// ✅ Good: Use proper ack flag (true for confirmed values)
await this.setStateAsync('sensor.value', sensorReading, true);
```

## Error Handling

### Robust Error Handling Pattern
```javascript
try {
    // Main operation
    const result = await this.performOperation();
    this.setState('info.connection', true, true);
} catch (error) {
    this.log.error(`Operation failed: ${error.message}`);
    this.setState('info.connection', false, true);
    
    // Implement retry logic if appropriate
    if (this.shouldRetry(error)) {
        this.scheduleRetry();
    }
}
```

### Adapter Lifecycle Management
```javascript
// ✅ Complete unload implementation
async unload(callback) {
  try {
    // Clear all timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

## TVSpielfilm Adapter Specific Patterns

### RSS Feed Processing
```javascript
// XML parsing with error handling
const parseString = require('xml2js').parseString;

async function processFeed(xmlData) {
    return new Promise((resolve, reject) => {
        parseString(xmlData, (err, result) => {
            if (err) {
                this.log.error(`XML parsing failed: ${err.message}`);
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}
```

### HTTP Request Patterns (Consider Migration)
```javascript
// Current pattern using 'request' (deprecated)
const request = require('request');

// Consider migrating to modern alternatives:
// - axios: npm install axios
// - node-fetch: npm install node-fetch  
// - Built-in fetch (Node.js 18+)

// Modern replacement example:
const axios = require('axios');

async function fetchRSSFeed(url) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'ioBroker.tvspielfilm'
            }
        });
        return response.data;
    } catch (error) {
        this.log.error(`Failed to fetch RSS feed from ${url}: ${error.message}`);
        throw error;
    }
}
```

### Search Functionality
```javascript
// Process search terms and alert when matches found
function processSearchTerms(programData, searchList) {
    if (!searchList || !Array.isArray(searchList)) return false;
    
    const programText = JSON.stringify(programData).toLowerCase();
    
    for (const searchTerm of searchList) {
        if (programText.includes(searchTerm.toLowerCase())) {
            this.log.info(`Search term "${searchTerm}" found in program data`);
            return true;
        }
    }
    return false;
}
```
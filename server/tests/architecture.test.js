import { AppError, BadRequestError, UnauthorizedError, NotFoundError, ConflictError, ValidationError } from '../src/utils/errors/appError.js';
import { ApiResponse } from '../src/utils/response/apiResponse.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';
import { requestIdMiddleware } from '../src/middlewares/requestIdMiddleware.js';
import { validate } from '../src/middlewares/validate.js';
import { validateRegister } from '../src/validators/authValidators.js';

async function runArchitectureTestSuite() {
  console.log('Starting Enterprise Code Architecture Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      failed++;
    }
  };

  try {
    // Test 1: AppError Hierarchy & Status Codes
    console.log('Test 1: Enterprise AppError Hierarchy');
    const badReq = new BadRequestError('Invalid input payload');
    const unauth = new UnauthorizedError('Token expired');
    const notFound = new NotFoundError('Project not found');
    const conflict = new ConflictError('Email already exists');
    const valErr = new ValidationError('Validation failed');

    assert(badReq instanceof AppError && badReq.statusCode === 400, 'BadRequestError defaults to HTTP 400');
    assert(unauth instanceof AppError && unauth.statusCode === 401, 'UnauthorizedError defaults to HTTP 401');
    assert(notFound instanceof AppError && notFound.statusCode === 404, 'NotFoundError defaults to HTTP 404');
    assert(conflict instanceof AppError && conflict.statusCode === 409, 'ConflictError defaults to HTTP 409');
    assert(valErr instanceof AppError && valErr.statusCode === 422, 'ValidationError defaults to HTTP 422');
    console.log('');

    // Test 2: ApiResponse Unified Contract Format
    console.log('Test 2: Unified ApiResponse Contract Format');
    let resStatus = 0;
    let resJson = null;
    const mockRes = {
      status(code) {
        resStatus = code;
        return this;
      },
      json(payload) {
        resJson = payload;
        return this;
      },
    };

    ApiResponse.success(mockRes, { data: { id: '123' }, message: 'Fetch successful' });
    assert(resStatus === 200, 'ApiResponse.success sets status 200');
    assert(resJson.success === true && resJson.data.id === '123', 'ApiResponse.success formats { success: true, data } payload');

    ApiResponse.error(mockRes, { message: 'Failed to update', statusCode: 400, errorCode: 'BAD_REQUEST' });
    assert(resStatus === 400, 'ApiResponse.error sets status 400');
    assert(resJson.success === false && resJson.error.code === 'BAD_REQUEST', 'ApiResponse.error formats { success: false, error } payload');
    console.log('');

    // Test 3: Async Handler Exception Propagation
    console.log('Test 3: Async Handler Exception Isolation');
    let capturedErr = null;
    const mockNext = (err) => {
      capturedErr = err;
    };
    const mockAsyncController = asyncHandler(async () => {
      throw new NotFoundError('Resource missing');
    });

    mockAsyncController({}, {}, mockNext);
    // Allow promise tick to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert(capturedErr instanceof NotFoundError, 'asyncHandler catches thrown error and passes to next(err)');
    assert(capturedErr.statusCode === 404, 'Captured error preserves HTTP status code');
    console.log('');

    // Test 4: Request Correlation ID Middleware
    console.log('Test 4: Request Correlation ID Middleware');
    const mockReq = { headers: {} };
    const mockResponseHeaders = {};
    const mockResId = {
      setHeader(name, val) {
        mockResponseHeaders[name] = val;
      },
    };

    requestIdMiddleware(mockReq, mockResId, () => {});
    assert(typeof mockReq.id === 'string' && mockReq.id.length > 0, 'requestIdMiddleware generates unique req.id');
    assert(mockResponseHeaders['x-request-id'] === mockReq.id, 'requestIdMiddleware sets x-request-id response header');
    console.log('');

    // Test 5: DTO Validation Interceptor
    console.log('Test 5: DTO Request Validation Interceptor');
    const invalidReq = { body: { email: 'invalid-email', password: '123' } };
    let validationErr = null;
    const validationMiddleware = validate(validateRegister);

    validationMiddleware(invalidReq, {}, (err) => {
      validationErr = err;
    });

    assert(validationErr instanceof ValidationError, 'validate middleware catches payload errors and returns ValidationError');
    assert(validationErr.statusCode === 422, 'ValidationError status code is 422');
    console.log('');

    // Test 6: Raw SQL Soft-Delete Guard (CI Compliance Rule)
    console.log('Test 6: Raw SQL Soft-Delete Guard Compliance');
    const fs = await import('fs');
    const path = await import('path');

    const getFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === 'tests') continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getFiles(filePath, fileList);
        } else if (filePath.endsWith('.js')) {
          fileList.push(filePath);
        }
      }
      return fileList;
    };

    const jsFiles = getFiles(path.resolve(process.cwd()));
    const softDeleteModels = ['Task', 'User', 'Workspace', 'Project'];
    let rawSqlViolations = 0;

    for (const filePath of jsFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('$queryRaw') || content.includes('$queryRawUnsafe') || content.includes('$executeRaw')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('$queryRaw') || line.includes('$queryRawUnsafe') || line.includes('$executeRaw')) {
            const contextBlock = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 5)).join(' ');
            for (const model of softDeleteModels) {
              const regex = new RegExp(`["\`']${model}["\`']|FROM\\s+["\`]?${model}["\`]?`, 'i');
              if (regex.test(contextBlock) && !contextBlock.toLowerCase().includes('deletedat is null')) {
                console.error(`  ❌ Raw SQL violation in ${path.relative(process.cwd(), filePath)} at line ${idx + 1}: querying "${model}" without deletedAt IS NULL`);
                rawSqlViolations++;
              }
            }
          }
        });
      }
    }

    assert(rawSqlViolations === 0, 'No raw SQL queries access soft-deletable models without explicit deletedAt IS NULL');
    console.log('');

    console.log('----------------------------------------------------');
    console.log(`ARCHITECTURE TEST SUITE SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Architecture test suite error:', error);
    process.exit(1);
  }
}

runArchitectureTestSuite();

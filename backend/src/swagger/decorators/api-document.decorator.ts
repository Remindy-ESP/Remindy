import { applyDecorators, Get, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentResponseDto } from '../../modules/document/presentation/dto/document-response.dto';
import { UpdateDocumentDto } from '../../modules/document/presentation/dto/update-document.dto';
import { ReprocessOcrDto } from '../../modules/document/presentation/dto/reprocess-ocr.dto';

export const ApiDocumentUpload = () =>
  applyDecorators(
    Post('upload'),
    HttpCode(HttpStatus.CREATED),
    ApiConsumes('multipart/form-data'),
    ApiOperation({ summary: 'Upload a document (PDF or image, max 10 MB)' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: { type: 'string', format: 'binary', description: 'File to upload (PDF or image)' },
          subscription_id: {
            type: 'string',
            format: 'uuid',
            description: 'Linked subscription ID (optional)',
          },
          contract_id: { type: 'number', description: 'Linked contract ID (optional)' },
          folder_id: {
            type: 'string',
            format: 'uuid',
            description: 'Destination folder ID (optional)',
          },
        },
      },
    }),
    ApiCreatedResponse({ type: DocumentResponseDto, description: 'Document uploaded' }),
    ApiBadRequestResponse({ description: 'Invalid file or size exceeds 10 MB' }),
  );

export const ApiDocumentFindOne = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get details of a specific document' }),
    ApiParam({ name: 'id', description: 'Document ID' }),
    ApiOkResponse({ type: DocumentResponseDto, description: 'Document details' }),
    ApiNotFoundResponse({ description: 'Document not found' }),
  );

export const ApiDocumentUpdate = () =>
  applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update a document (filename, folder)' }),
    ApiParam({ name: 'id', description: 'Document ID' }),
    ApiBody({ type: UpdateDocumentDto }),
    ApiOkResponse({ type: DocumentResponseDto, description: 'Document updated' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiNotFoundResponse({ description: 'Document not found' }),
  );

export const ApiDocumentFindAll = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get all documents with optional filters' }),
    ApiQuery({
      name: 'subscription_id',
      required: false,
      description: 'Filter by subscription ID',
    }),
    ApiQuery({ name: 'contract_id', required: false, description: 'Filter by contract ID' }),
    ApiQuery({
      name: 'ocr_status',
      required: false,
      enum: ['pending', 'processing', 'completed', 'failed'],
    }),
    ApiQuery({ name: 'mime_type', required: false, description: 'Filter by MIME type' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' }),
    ApiQuery({
      name: 'sort',
      required: false,
      description: 'Sort order',
      example: 'uploaded_at:desc',
    }),
    ApiOkResponse({ type: [DocumentResponseDto], description: 'List of documents' }),
  );

export const ApiDocumentDelete = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a document (soft delete)' }),
    ApiParam({ name: 'id', description: 'Document ID' }),
    ApiNoContentResponse({ description: 'Document deleted' }),
    ApiNotFoundResponse({ description: 'Document not found' }),
  );

export const ApiDocumentReprocessOcr = () =>
  applyDecorators(
    Post(':id/reprocess-ocr'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Reprocess OCR for a document' }),
    ApiParam({ name: 'id', description: 'Document ID' }),
    ApiBody({ type: ReprocessOcrDto }),
    ApiOkResponse({ type: DocumentResponseDto, description: 'OCR reprocessing started' }),
    ApiNotFoundResponse({ description: 'Document not found' }),
    ApiBadRequestResponse({ description: 'OCR already completed (use force=true to override)' }),
  );

export const ApiDocumentDownload = () =>
  applyDecorators(
    Get(':id/download'),
    ApiOperation({ summary: 'Download a document' }),
    ApiParam({ name: 'id', description: 'Document ID' }),
    ApiOkResponse({ description: 'File download stream' }),
    ApiNotFoundResponse({ description: 'Document not found' }),
  );

export const ApiDocumentGetQuota = () =>
  applyDecorators(
    Get('quota'),
    ApiOperation({ summary: 'Get current user document quota usage' }),
    ApiOkResponse({
      description: 'Quota statistics',
      schema: {
        type: 'object',
        properties: {
          documentsCount: { type: 'number', example: 15 },
          maxDocuments: { type: 'number', example: 50 },
          storageUsed: { type: 'number', example: 25600000 },
          maxStorage: { type: 'number', example: 104857600 },
          storageUsedPercent: { type: 'number', example: 24.41 },
          documentsUsedPercent: { type: 'number', example: 30 },
          storageUsedFormatted: { type: 'string', example: '24.41 MB' },
          maxStorageFormatted: { type: 'string', example: '100.00 MB' },
        },
      },
    }),
  );

export const ApiDocumentQueueStats = () =>
  applyDecorators(
    Get('queue/stats'),
    ApiOperation({ summary: 'Get OCR queue statistics' }),
    ApiOkResponse({
      description: 'Queue stats',
      schema: {
        type: 'object',
        properties: {
          waiting: { type: 'number', example: 5 },
          active: { type: 'number', example: 2 },
          completed: { type: 'number', example: 150 },
          failed: { type: 'number', example: 3 },
        },
      },
    }),
  );

export const ApiDocumentJobStatus = () =>
  applyDecorators(
    Get('job/:jobId/status'),
    ApiOperation({ summary: 'Get status of a specific OCR job' }),
    ApiParam({ name: 'jobId', description: 'OCR job ID' }),
    ApiOkResponse({ description: 'Job status' }),
    ApiNotFoundResponse({ description: 'Job not found' }),
  );

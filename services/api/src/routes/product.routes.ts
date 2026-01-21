import { Router, Request, Response } from 'express';
import { productService } from '../services/product.service';
import { ApiResponse, ProductLookupResult } from '../types';

const router = Router();

/**
 * GET /api/products/lookup/:barcode
 * Look up a product by barcode
 */
router.get('/lookup/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const skipCache = req.query.skipCache === 'true';
    const useMockFallback = req.query.useMock === 'true';

    if (!barcode || barcode.length < 8) {
      const response: ApiResponse<ProductLookupResult> = {
        success: false,
        error: 'Invalid barcode. Must be at least 8 digits.',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const result = await productService.lookupByBarcode(barcode, {
      skipCache,
      useMockFallback
    });

    const response: ApiResponse<ProductLookupResult> = {
      success: result.success,
      data: result,
      cached: result.source === 'cache',
      timestamp: new Date().toISOString()
    };

    if (!result.success) {
      response.error = result.error;
    }

    res.json(response);
  } catch (error) {
    console.error('Product lookup error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/products/search
 * Search for a product by name (manual fallback)
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Product name is required (minimum 2 characters)',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const result = await productService.searchByName(name.trim());

    const response: ApiResponse<ProductLookupResult> = {
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Product search error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;

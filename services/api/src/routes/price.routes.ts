import { Router, Request, Response } from 'express';
import { priceService } from '../services/price.service';
import { productService } from '../services/product.service';
import { ApiResponse, PriceEstimate, Product } from '../types';

const router = Router();

/**
 * GET /api/prices/estimate/:barcode
 * Get price estimate for a product by barcode
 */
router.get('/estimate/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const { zipCode, radius, skipCache } = req.query;

    if (!barcode || barcode.length < 8) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid barcode. Must be at least 8 digits.',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // First, look up the product
    const productResult = await productService.lookupByBarcode(barcode, {
      useMockFallback: true
    });

    if (!productResult.success || !productResult.product) {
      const response: ApiResponse<null> = {
        success: false,
        error: productResult.error || 'Product not found',
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    // Get price estimate
    const estimate = await priceService.getPriceEstimate(productResult.product, {
      zipCode: zipCode as string,
      radius: radius ? parseInt(radius as string, 10) : undefined,
      skipCache: skipCache === 'true'
    });

    const response: ApiResponse<PriceEstimate & { product: Product }> = {
      success: true,
      data: {
        ...estimate,
        product: productResult.product
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Price estimate error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/prices/estimate
 * Get price estimate for a product by details
 */
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { product, zipCode, radius } = req.body;

    if (!product || !product.title) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Product details are required',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const estimate = await priceService.getPriceEstimate(product as Product, {
      zipCode,
      radius
    });

    const response: ApiResponse<PriceEstimate> = {
      success: true,
      data: estimate,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Price estimate error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/prices/facebook-url
 * Get Facebook Marketplace search URL for a product
 */
router.get('/facebook-url', async (req: Request, res: Response) => {
  try {
    const { barcode, title, brand, zipCode, radius } = req.query;

    let product: Product;

    if (barcode) {
      const productResult = await productService.lookupByBarcode(
        barcode as string,
        { useMockFallback: true }
      );

      if (!productResult.success || !productResult.product) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Product not found',
          timestamp: new Date().toISOString()
        };
        return res.status(404).json(response);
      }

      product = productResult.product;
    } else if (title) {
      product = {
        barcode: '',
        title: title as string,
        brand: brand as string
      };
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Barcode or title is required',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const url = priceService.generateFacebookMarketplaceUrl(product, {
      zipCode: zipCode as string,
      radius: radius ? parseInt(radius as string, 10) : undefined
    });

    const response: ApiResponse<{ url: string; product: Product }> = {
      success: true,
      data: { url, product },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Facebook URL generation error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;

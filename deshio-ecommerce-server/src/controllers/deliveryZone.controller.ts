import { Request, Response } from 'express';
import DeliveryZone from '../models/deliveryZone.model';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import sendResponse from '../utils/sendResponse';

// GET /api/v1/delivery-zones  (public — active only; admin can pass ?all=true)
const getDeliveryZones = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  let zones = await DeliveryZone.find(filter).sort({ charge: 1 });

  // Auto-seed default zones if database has no delivery zones at all
  if (zones.length === 0 && req.query.all !== 'true') {
    const totalCount = await DeliveryZone.countDocuments();
    if (totalCount === 0) {
      await DeliveryZone.create([
        { name: 'Inside Dhaka', charge: 80, estimatedDays: '1-2 business days', isActive: true },
        { name: 'Outside Dhaka', charge: 120, estimatedDays: '2-4 business days', isActive: true },
      ]);
      zones = await DeliveryZone.find(filter).sort({ charge: 1 });
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delivery zones retrieved successfully',
    data: zones,
  });
});

// POST /api/v1/delivery-zones  (admin)
const createDeliveryZone = asyncHandler(async (req: Request, res: Response) => {
  const { name, charge, estimatedDays, isActive } = req.body;
  const zone = await DeliveryZone.create({
    name: String(name || '').trim(),
    charge: Number(charge) || 0,
    estimatedDays: String(estimatedDays || '').trim() || '2-3 business days',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Delivery zone created successfully',
    data: zone,
  });
});

// PATCH /api/v1/delivery-zones/:id  (admin)
const updateDeliveryZone = asyncHandler(async (req: Request, res: Response) => {
  const { name, charge, estimatedDays, isActive } = req.body;
  const update: Record<string, any> = {};
  if (name !== undefined) update.name = String(name).trim();
  if (charge !== undefined) update.charge = Number(charge);
  if (estimatedDays !== undefined) update.estimatedDays = String(estimatedDays).trim();
  if (isActive !== undefined) update.isActive = Boolean(isActive);

  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!zone) throw new AppError('Delivery zone not found', 404);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delivery zone updated successfully',
    data: zone,
  });
});

// DELETE /api/v1/delivery-zones/:id  (admin)
const deleteDeliveryZone = asyncHandler(async (req: Request, res: Response) => {
  const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
  if (!zone) throw new AppError('Delivery zone not found', 404);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Delivery zone deleted successfully',
  });
});

export const deliveryZoneControllers = {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
};

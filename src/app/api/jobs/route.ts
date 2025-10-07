import { NextRequest, NextResponse } from 'next/server';
import { mockWorkOrders } from '@/lib/data-source';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 JOBS API: Starting request');
    
    // Always use mock data for now
    console.log('🔍 JOBS API: Using mock data');
    
    // Convert work orders to job format
    const mockJobs = mockWorkOrders.map((workOrder: any) => ({
      id: workOrder.id,
      title: workOrder.description || 'Work Order',
      status: workOrder.status || 'PENDING',
      priority: workOrder.priority || 'MEDIUM',
      requestedDate: workOrder.startDate ? new Date(workOrder.startDate) : new Date(),
      estimatedHours: 4, // Default value
      actualHours: 0,
      jobCategory: 'General',
      jobNotes: '',
      isUrgent: workOrder.priority === 'HIGH',
      assignedToStaffId: 'staff-1',
      assignedToStaffName: 'Mike Johnson',
      assignedToStaffRole: 'Senior Marine Engineer',
      customerName: workOrder.customerName || 'Unknown',
      customerEmail: 'customer@example.com',
      customerPhone: '+44 7700 900123',
      boatName: workOrder.boatName || 'Unknown',
      boatRegistration: 'GB-12345',
      boatType: 'Motor Yacht',
      cost: workOrder.estimatedCost || 0,
      timeStarted: undefined,
      timeStopped: undefined,
      isTimerRunning: false,
      progress: workOrder.status === 'COMPLETED' ? 100 : workOrder.status === 'IN_PROGRESS' ? 50 : 0,
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.workOrderNumber || `WO-${workOrder.id}`
    }));
    
    console.log('✅ JOBS API: Successfully returned mock jobs', { count: mockJobs.length });
    return NextResponse.json(mockJobs);

  } catch (error) {
    console.error('❌ JOBS API: Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



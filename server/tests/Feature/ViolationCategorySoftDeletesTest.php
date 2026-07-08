<?php

namespace Tests\Feature;

use App\Models\ViolationCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ViolationCategorySoftDeletesTest extends TestCase
{
    use RefreshDatabase;

    public function test_violation_category_can_be_soft_deleted_and_restored(): void
    {
        $category = ViolationCategory::create([
            'category_name' => 'Noise Complaint',
            'description' => 'Excessive noise',
            'penalty_amount' => '500',
        ]);

        $this->assertFalse($category->trashed());

        $category->delete();

        $this->assertTrue($category->trashed());
        $this->assertSame(0, ViolationCategory::count());
        $this->assertSame(1, ViolationCategory::withTrashed()->count());

        $category->restore();

        $this->assertFalse($category->trashed());
        $this->assertSame(1, ViolationCategory::count());
        $this->assertSame(1, ViolationCategory::withTrashed()->count());
    }
}

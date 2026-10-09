<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workshops', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->unique()->after('id');
            $table->string('instructor')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('workshops', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'instructor']);
        });
    }
};

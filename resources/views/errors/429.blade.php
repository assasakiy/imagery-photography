@extends('layouts.app')

@section('title', 'Terlalu Banyak Permintaan')
@section('meta_description', 'Terlalu banyak permintaan dalam waktu singkat.')

@section('content')
    @include('errors.includes.layout', ['status' => '429'])
@endsection
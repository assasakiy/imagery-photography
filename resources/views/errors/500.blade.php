@extends('layouts.app')

@section('title', 'Terjadi Kesalahan')
@section('meta_description', 'Terjadi kesalahan pada server.')

@section('content')
    @include('errors.includes.layout', ['status' => '500'])
@endsection